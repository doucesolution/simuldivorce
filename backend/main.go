/*
 * ============================================================================
 * SimulDivorce — Backend Server (Go + Gin)
 * ============================================================================
 *
 * This file is the main entry point of the SimulDivorce backend API server.
 * SimulDivorce is a French divorce simulation application that helps users
 * estimate financial outcomes of divorce proceedings.
 *
 * This backend provides:
 *   1. A /api/config endpoint returning legal constants (SMIC, tax rates, etc.)
 *   2. A /api/deliver endpoint that uploads generated PDF documents to Google
 *      Drive via a Google Apps Script web app, then notifies an external
 *      webhook (e.g., Make.com / Zapier) so an email can be sent to the user.
 *   3. A /api/methodology-request endpoint that forwards methodology document
 *      requests to a Make.com webhook for automated email delivery.
 *
 * Key technical features:
 *   - Gin web framework for HTTP routing and middleware
 *   - CORS configuration restricted to known frontend origins
 *   - In-memory sliding-window rate limiting per IP address
 *   - Environment-based configuration via .env file or OS env vars
 *
 * ============================================================================
 */

// package main — declares this file as the main executable package in Go.
// When compiled, Go will look for the main() function in this package as the
// program entry point.
package main

// import block — brings in all external and standard library dependencies
// needed by this server. Each package serves a specific purpose as noted below.
import (
	"bytes"         // bytes — provides the bytes.NewReader function used to wrap JSON payloads into io.Reader for HTTP POST request bodies
	"encoding/json" // encoding/json — provides json.Marshal for serializing Go maps/structs into JSON byte slices sent to external APIs
	"fmt"           // fmt — provides fmt.Sprintf for formatted string construction (used to generate unique document IDs)
	"io"            // io — provides io.ReadAll to read response bodies from external HTTP calls for error logging
	"log"           // log — provides log.Printf and log.Println for structured server-side logging with timestamps
	"net/http"      // net/http — provides HTTP client (http.Post) for outbound API calls and HTTP status constants (e.g., http.StatusOK)
	"os"            // os — provides os.Getenv to read environment variables for configuration (URLs, secrets, ports)
	"strings"       // strings — provides strings.Split to parse comma-separated ALLOWED_ORIGINS env var into a slice
	"sync"          // sync — provides sync.Mutex for thread-safe access to the in-memory rate limiter's visitor map
	"time"          // time — provides time.Time, time.Now(), time.Duration for rate limiter timestamps and CORS max-age settings

	"github.com/gin-contrib/cors" // gin-contrib/cors — third-party Gin middleware that handles Cross-Origin Resource Sharing (CORS) headers automatically
	"github.com/gin-gonic/gin"    // gin-gonic/gin — the Gin HTTP web framework providing routing, middleware, JSON binding, and response helpers
	"github.com/joho/godotenv"    // joho/godotenv — loads environment variables from a .env file into os environment; useful for local development
)

// ── Configuration (from environment) ─────────────────────────
// This section provides a helper function to read environment variables
// with a fallback default value, enabling flexible configuration across
// development (via .env) and production (via OS-level env vars).

// env is a utility function that reads an environment variable by key.
// If the variable is set and non-empty, its value is returned.
// Otherwise, the provided fallback default value is returned instead.
// This pattern avoids repetitive if/else blocks throughout the codebase
// and centralizes the "env var with default" logic in one place.
func env(key, fallback string) string {
	// os.Getenv retrieves the value of the environment variable named by key.
	// If the variable is not present or is empty, it returns an empty string "".
	if v := os.Getenv(key); v != "" {
		// The environment variable exists and is non-empty, so we return its value.
		return v
	}
	// The environment variable was not set or was empty — return the fallback default.
	return fallback
}

// ── Types ────────────────────────────────────────────────────
// This section defines the structs (data models) used by the API.
// Each struct maps to a JSON request or response body, with struct tags
// controlling JSON serialization names and Gin's binding validation rules.

// LegalConfig holds the legal constants and configuration values that the
// frontend needs to perform divorce simulation calculations. These values
// are served by the GET /api/config endpoint so the frontend stays in sync
// with the backend's authoritative legal parameters.
type LegalConfig struct {
	// SMIC is the French minimum monthly wage (Salaire Minimum Interprofessionnel de Croissance)
	// in euros. Used as a baseline reference for financial calculations in divorce proceedings.
	// JSON key: "smic" — sent to the frontend as a floating-point number.
	SMIC float64 `json:"smic"`
	// TaxRateLow is the lower marginal income tax rate (11%) applied to income brackets
	// below a certain threshold. Used in net income calculations for each spouse.
	// JSON key: "tax_rate_low" — sent as a decimal (0.11 = 11%).
	TaxRateLow float64 `json:"tax_rate_low"`
	// TaxRateHigh is the higher marginal income tax rate (30%) applied to income brackets
	// above the lower threshold. Used in net income calculations for higher earners.
	// JSON key: "tax_rate_high" — sent as a decimal (0.30 = 30%).
	TaxRateHigh float64 `json:"tax_rate_high"`
	// LegalPoints is the name of the legal methodology used for calculating compensatory
	// benefits (prestation compensatoire). "Pilotelle" refers to a well-known French
	// judicial method for evaluating these amounts.
	// JSON key: "legal_points_method" — sent as a string identifier.
	LegalPoints string `json:"legal_points_method"`
}

// DeliverRequest is the JSON payload expected by the POST /api/deliver endpoint.
// The frontend sends this after the user generates a PDF document and wants it
// delivered to their email address via Google Drive upload + webhook notification.
type DeliverRequest struct {
	// FileBase64 is the base64-encoded content of the generated PDF document.
	// The frontend encodes the PDF binary data as a base64 string so it can be
	// transmitted safely in a JSON payload. The Google Apps Script on the other
	// end will decode this back into binary and save it to Google Drive.
	// binding:"required" — Gin will reject the request with a 400 error if this field is missing or empty.
	FileBase64 string `json:"fileBase64" binding:"required"`
	// Email is the user's email address where the document delivery notification
	// will be sent. The webhook service (e.g., Make.com) uses this to send an email
	// with a link to the uploaded Google Drive document.
	// binding:"required,email" — Gin validates that this field is present AND is a valid email format.
	Email string `json:"email"      binding:"required,email"`
}

// MethodologyRequest is the JSON payload expected by the POST /api/methodology-request endpoint.
// The frontend sends this when a user wants to receive methodology documentation
// (legal calculation explanations) for specific categories via email.
type MethodologyRequest struct {
	// Email is the user's email address where the methodology documents will be sent.
	// binding:"required,email" — must be present and a valid email format.
	Email string `json:"email"      binding:"required,email"`
	// Categories is a list of methodology category identifiers (e.g., "prestation_compensatoire",
	// "pension_alimentaire") that the user has selected. The webhook service uses these
	// to determine which methodology documents to include in the email.
	// binding:"required,min=1" — must be present and contain at least one category.
	Categories []string `json:"categories" binding:"required,min=1"`
}

// ── Simple in-memory rate limiter ────────────────────────────
// This section implements a sliding-window rate limiter that tracks
// request timestamps per IP address. It prevents abuse by limiting
// the number of requests a single IP can make within a time window.
// Note: This is an in-memory solution — it resets when the server restarts
// and does not work across multiple server instances (horizontal scaling).
// For production at scale, consider Redis-based rate limiting instead.

// rateLimiter is a struct that holds the state for the in-memory rate limiter.
// It uses a map of IP addresses to slices of timestamps, protected by a mutex
// for concurrent access safety since Gin handles requests in parallel goroutines.
type rateLimiter struct {
	// mu is a mutual exclusion lock (mutex) that ensures only one goroutine
	// can read/write the visitors map at a time, preventing race conditions.
	mu sync.Mutex
	// visitors maps each client IP address (string) to a slice of time.Time values
	// representing the timestamps of their recent requests within the sliding window.
	visitors map[string][]time.Time
	// limit is the maximum number of requests allowed per IP within the time window.
	// For example, limit=5 means at most 5 requests per window period.
	limit int
	// window is the duration of the sliding time window (e.g., 1 minute).
	// Requests older than (now - window) are pruned and no longer count against the limit.
	window time.Duration
}

// newRateLimiter is a constructor function that creates and returns a new rateLimiter
// instance with the given limit (max requests) and window (time duration).
// It initializes the visitors map as an empty map ready to track IP addresses.
func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	// Return a pointer to a new rateLimiter struct with all fields initialized.
	return &rateLimiter{
		// Initialize the visitors map — make() creates an empty map[string][]time.Time
		// that will store per-IP request timestamp histories.
		visitors: make(map[string][]time.Time),
		// Set the maximum number of allowed requests per window from the parameter.
		limit: limit,
		// Set the sliding window duration from the parameter (e.g., time.Minute).
		window: window,
	}
}

// allow checks whether a request from the given IP address should be permitted.
// It implements a sliding window algorithm: it removes expired timestamps,
// checks if the remaining count is under the limit, and if so, records the
// new request timestamp and returns true. Returns false if the limit is exceeded.
func (rl *rateLimiter) allow(ip string) bool {
	// Lock the mutex to ensure exclusive access to the visitors map.
	// This is critical because multiple Gin handler goroutines may call allow()
	// concurrently for different (or the same) IP addresses.
	rl.mu.Lock()
	// defer ensures Unlock() is called when this function returns, regardless of
	// which return path is taken. This prevents deadlocks if we forget to unlock.
	defer rl.mu.Unlock()
	// Capture the current time — used both for pruning old entries and recording new ones.
	now := time.Now()
	// Calculate the cutoff time: any request timestamp before this is outside the
	// sliding window and should be discarded. For a 1-minute window, cutoff = now - 1 min.
	cutoff := now.Add(-rl.window)

	// Keep only recent timestamps — filter the existing timestamps for this IP,
	// retaining only those that fall within the current sliding window.
	var recent []time.Time // Start with a nil slice (will be populated by the loop below)
	// Iterate over all recorded timestamps for this IP address.
	for _, t := range rl.visitors[ip] {
		// If this timestamp is after the cutoff, it's still within the window — keep it.
		if t.After(cutoff) {
			// Append the still-valid timestamp to the recent slice.
			recent = append(recent, t)
		}
		// Otherwise, the timestamp is expired and we simply don't include it (pruned).
	}
	// Check if the number of recent (non-expired) requests has reached or exceeded the limit.
	if len(recent) >= rl.limit {
		// Update the visitors map with only the recent timestamps (prune old ones)
		// even though we're rejecting this request — keeps the map clean.
		rl.visitors[ip] = recent
		// Return false to indicate this request should be rejected (rate limit exceeded).
		return false
	}
	// The IP is under the limit — record this new request by appending the current
	// timestamp to the recent slice, then store the updated slice in the visitors map.
	rl.visitors[ip] = append(recent, now)
	// Return true to indicate this request is allowed to proceed.
	return true
}

// rateLimitMiddleware creates a Gin middleware handler function that wraps a rateLimiter.
// It extracts the client's IP address from the request context, checks the rate limiter,
// and either allows the request to proceed or returns a 429 Too Many Requests error.
// This middleware is applied to specific routes (deliver, methodology-request) rather
// than globally, so public endpoints like /api/config remain unrestricted.
func rateLimitMiddleware(rl *rateLimiter) gin.HandlerFunc {
	// Return a closure (anonymous function) that captures the rateLimiter pointer.
	// Gin will call this function for each incoming request on the protected route.
	return func(c *gin.Context) {
		// Extract the client's IP address from the Gin context.
		// Gin's ClientIP() respects X-Forwarded-For and X-Real-IP headers,
		// which is important when running behind a reverse proxy or load balancer.
		ip := c.ClientIP()
		// Check if this IP is allowed to make another request within the rate limit window.
		if !rl.allow(ip) {
			// The IP has exceeded the rate limit — respond with HTTP 429 and an error message.
			// gin.H is a shorthand for map[string]interface{}, used to build JSON responses.
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			// Abort prevents any subsequent middleware or the route handler from executing.
			// Without Abort(), Gin would continue processing the request chain.
			c.Abort()
			// Return early — do not call c.Next() since we've aborted the request.
			return
		}
		// The IP is within the rate limit — pass control to the next middleware or handler
		// in the Gin handler chain. This is how Gin middleware "allows" a request through.
		c.Next()
	}
}

// ── Main ─────────────────────────────────────────────────────
// The main function is the entry point of the Go program.
// It configures and starts the HTTP server with all middleware and routes.

// main initializes the Gin router, applies CORS and rate limiting middleware,
// registers all API route handlers, and starts listening for HTTP requests.
func main() {
	// Load environment variables from a .env file in the current directory, if one exists.
	// In local development, .env contains secrets like DRIVE_UPLOAD_URL and WEBHOOK_URL.
	// In production (e.g., Docker / cloud), these are set as real OS environment variables,
	// so the .env file won't exist and godotenv.Load() will return an error — which we
	// intentionally discard with _ (blank identifier) since it's a non-critical failure.
	_ = godotenv.Load()

	// Create a new Gin router with default middleware already attached:
	// - gin.Logger() — logs each HTTP request method, path, status code, and latency to stdout
	// - gin.Recovery() — recovers from any panics in handlers and returns a 500 error
	// gin.Default() is preferred over gin.New() for most applications because it provides
	// sensible defaults out of the box.
	r := gin.Default()

	// ── CORS — restricted to known origins ───────────────────
	// Read the ALLOWED_ORIGINS environment variable, which contains a comma-separated
	// list of frontend origin URLs that are permitted to make cross-origin requests.
	// The fallback value includes the production domain (simuldivorce.fr), its www variant,
	// and two localhost ports used during development (Vite dev server on 5173 and preview on 4173).
	allowedOrigins := env("ALLOWED_ORIGINS", "https://simuldivorce.fr,https://www.simuldivorce.fr,http://localhost:5173,http://localhost:4173")
	// Split the comma-separated string into a slice of individual origin strings.
	// e.g., "https://simuldivorce.fr,http://localhost:5173" → ["https://simuldivorce.fr", "http://localhost:5173"]
	origins := strings.Split(allowedOrigins, ",")

	// Configure the CORS middleware with specific rules for this application.
	// CORS is essential because the frontend (served from simuldivorce.fr or localhost)
	// makes API requests to a different origin (the backend server), and browsers block
	// such cross-origin requests by default unless the server sends proper CORS headers.
	corsConfig := cors.Config{
		// AllowOrigins specifies exactly which frontend origins are allowed to call this API.
		// Requests from any other origin will be rejected by the browser (no Access-Control-Allow-Origin header).
		AllowOrigins: origins,
		// AllowMethods lists the HTTP methods the frontend is allowed to use.
		// GET — for fetching /api/config; POST — for submitting delivery/methodology requests;
		// OPTIONS — for CORS preflight requests that browsers send automatically before POST requests.
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		// AllowHeaders lists the HTTP headers the frontend is allowed to send in requests.
		// Origin — standard CORS header; Content-Length — for specifying body size;
		// Content-Type — for specifying "application/json" in POST requests.
		AllowHeaders: []string{"Origin", "Content-Length", "Content-Type"},
		// MaxAge sets how long (in duration) the browser should cache the preflight response.
		// 12 hours means the browser won't re-send OPTIONS preflight requests for 12 hours,
		// reducing latency for subsequent API calls from the same origin.
		MaxAge: 12 * time.Hour,
	}
	// Apply the CORS middleware globally to ALL routes on this Gin router.
	// r.Use() adds middleware to the default middleware chain — every incoming request
	// will pass through the CORS handler, which adds appropriate response headers.
	r.Use(cors.New(corsConfig))

	// Create two separate rate limiter instances — one for each protected endpoint.
	// Using separate limiters means each endpoint has its own independent quota:
	// a user could make 5 deliver requests AND 5 methodology requests per minute.

	// Rate limiter for the /api/deliver endpoint: allows 5 requests per minute per IP.
	// This prevents abuse of the document delivery feature, which involves external API calls
	// to Google Drive and a webhook service, both of which have their own rate limits and costs.
	deliverRL := newRateLimiter(5, time.Minute)
	// Rate limiter for the /api/methodology-request endpoint: allows 5 requests per minute per IP.
	// This prevents spam of methodology email requests, which also trigger external webhook calls.
	methodologyRL := newRateLimiter(5, time.Minute)

	// Create an API route group with the prefix "/api".
	// All routes registered on this group will be accessible under /api/...
	// Route groups help organize related endpoints and can share middleware.
	api := r.Group("/api")
	{
		// GET /api/config — returns the current legal configuration constants (SMIC, tax rates, etc.)
		// to the frontend. No rate limiting is applied because this is a lightweight read-only endpoint
		// that returns static data and doesn't trigger any external API calls.
		api.GET("/config", getConfig)
		// POST /api/deliver — handles document delivery requests from the frontend.
		// The rateLimitMiddleware(deliverRL) runs BEFORE handleDeliver, rejecting requests
		// if the IP has exceeded 5 requests/minute. If the rate limit allows it, handleDeliver
		// uploads the document to Google Drive and notifies the webhook for email delivery.
		api.POST("/deliver", rateLimitMiddleware(deliverRL), handleDeliver)
		// POST /api/methodology-request — handles methodology document email requests.
		// Protected by its own rate limiter (methodologyRL) with the same 5 req/min limit.
		// If allowed, handleMethodologyRequest forwards the request to a Make.com webhook
		// that sends the selected methodology documents to the user's email.
		api.POST("/methodology-request", rateLimitMiddleware(methodologyRL), handleMethodologyRequest)
	}

	// Read the PORT environment variable (default: "8080") to determine which port
	// the HTTP server should listen on. In production (Docker/cloud), PORT is typically
	// set by the hosting platform (e.g., Cloud Run sets PORT=8080 by default).
	port := env("PORT", "8080")
	// Log the port number to stdout so operators can confirm which port the server is binding to.
	// log.Printf includes a timestamp prefix, which is useful for production log analysis.
	log.Printf("Starting server on :%s", port)
	// Start the Gin HTTP server, listening on all network interfaces (0.0.0.0) on the specified port.
	// r.Run() is a convenience wrapper around http.ListenAndServe() that blocks forever
	// (or until the process is terminated). The ":" prefix means "listen on all interfaces".
	// If r.Run() returns an error (e.g., port already in use), Gin logs it and the process exits.
	r.Run(":" + port)
}

// ── Handlers ─────────────────────────────────────────────────
// This section contains the HTTP handler functions that implement the business
// logic for each API endpoint. Each handler receives a *gin.Context which provides
// access to the HTTP request, response writer, JSON binding, and path parameters.

// getConfig handles GET /api/config requests.
// It returns a JSON object containing the current French legal constants used by
// the frontend's divorce simulation calculator. These values are hardcoded here
// (rather than in a database) because they change infrequently — typically only
// when French law is updated annually. Centralizing them in the backend ensures
// all frontend clients use the same values without needing a frontend redeployment.
func getConfig(c *gin.Context) {
	// Create a LegalConfig struct populated with the current legal values.
	config := LegalConfig{
		// SMIC: the French monthly minimum wage in euros (net, as of the current legal period).
		// Used as a reference point in various divorce financial calculations.
		SMIC: 1398.69,
		// TaxRateLow: the 11% marginal tax rate applied to the first taxable income bracket.
		// In 2024 French tax law, this applies to income between ~11,295 and ~28,797 euros.
		TaxRateLow: 0.11,
		// TaxRateHigh: the 30% marginal tax rate applied to the next income bracket.
		// In 2024 French tax law, this applies to income between ~28,797 and ~82,341 euros.
		TaxRateHigh: 0.30,
		// LegalPoints: the name of the legal methodology for prestation compensatoire calculation.
		// "Pilotelle" is a recognized French judicial method for estimating compensatory benefits.
		LegalPoints: "Pilotelle",
	}
	// Serialize the config struct to JSON and send it as the HTTP response body
	// with a 200 OK status code. Gin automatically sets Content-Type: application/json.
	c.JSON(http.StatusOK, config)
}

// handleDeliver handles POST /api/deliver requests.
// This is the core document delivery pipeline:
//   1. Validate the incoming JSON request (base64 file + email)
//   2. Generate a unique document ID for tracking
//   3. Upload the base64-encoded file to Google Drive via a Google Apps Script web app
//   4. Notify an external webhook (e.g., Make.com) with the email and document ID
//      so it can send the user an email with a link to their document
//
// The two-step process (Drive upload + webhook notification) allows for partial
// success: if the webhook fails but the upload succeeded, the user is still informed
// and the document is safely stored on Google Drive.
func handleDeliver(c *gin.Context) {
	// Declare a variable to hold the parsed request body.
	var req DeliverRequest
	// ShouldBindJSON reads the request body, parses it as JSON, and populates the
	// DeliverRequest struct fields. It also runs validation based on the `binding` struct tags:
	// - FileBase64 must be non-empty (binding:"required")
	// - Email must be non-empty and a valid email format (binding:"required,email")
	// If validation fails, err will contain a descriptive error message.
	if err := c.ShouldBindJSON(&req); err != nil {
		// Respond with HTTP 400 Bad Request and include the validation error details
		// so the frontend can display a meaningful error message to the user.
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		// Return early — do not proceed with the delivery pipeline.
		return
	}

	// Read the Google Drive upload URL from the environment. This is the URL of a
	// Google Apps Script web app (deployed as doPost) that accepts the base64 file,
	// decodes it, and saves it as a PDF in a specific Google Drive folder.
	driveURL := os.Getenv("DRIVE_UPLOAD_URL")
	// Read the webhook URL from the environment. This is typically a Make.com or Zapier
	// webhook endpoint that triggers an automated email workflow when called.
	webhookURL := os.Getenv("WEBHOOK_URL")

	// Check that both required external service URLs are configured.
	// If either is missing, the delivery pipeline cannot function.
	if driveURL == "" || webhookURL == "" {
		// Log the configuration error server-side for operators to investigate.
		log.Println("[deliver] DRIVE_UPLOAD_URL or WEBHOOK_URL not configured")
		// Respond with HTTP 503 Service Unavailable — the server itself is fine,
		// but an external dependency is not configured, making delivery impossible.
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "delivery service not configured"})
		// Return early — cannot proceed without the external URLs.
		return
	}

	// Generate a unique document ID by combining the current timestamp in milliseconds
	// (hex-encoded) with the last 16 bits of the nanosecond timestamp (also hex-encoded).
	// This produces an ID like "18f3a2b4c00-3f1a" that is practically unique for each request.
	// The hex format keeps the ID short and URL-friendly. The nanosecond suffix adds extra
	// uniqueness in case two requests arrive within the same millisecond.
	documentId := fmt.Sprintf("%x-%x", time.Now().UnixMilli(), time.Now().UnixNano()%0xFFFF)

	// ── Step 1: Upload to Google Drive via Google Apps Script ──
	// Prepare the JSON payload for the Google Apps Script web app.
	// json.Marshal converts the Go map into a JSON byte slice.
	// The second return value (error) is discarded with _ because marshaling a
	// simple map[string]string cannot fail in practice.
	drivePayload, _ := json.Marshal(map[string]string{
		"fileBase64": req.FileBase64, // The base64-encoded PDF file content from the frontend
		"documentId": documentId,     // The unique ID so the file can be named/tracked on Drive
	})

	// Send an HTTP POST request to the Google Apps Script web app.
	// Content-Type is "text/plain" because Google Apps Script's doPost() function
	// expects the payload as a plain text string (it will parse the JSON internally).
	// bytes.NewReader wraps the byte slice as an io.Reader, which http.Post requires.
	driveResp, err := http.Post(driveURL, "text/plain", bytes.NewReader(drivePayload))
	// Check if the HTTP request itself failed (e.g., network error, DNS resolution failure,
	// timeout). This does NOT check the HTTP response status code.
	if err != nil {
		// Log the network-level error for debugging. The %v verb prints the error message.
		log.Printf("[deliver] Drive upload error: %v", err)
		// Respond with HTTP 502 Bad Gateway — our server is fine, but the upstream
		// Google Apps Script service could not be reached.
		c.JSON(http.StatusBadGateway, gin.H{"error": "drive upload failed"})
		// Return early — the upload failed so there's nothing more to do.
		return
	}
	// Defer closing the response body to prevent resource leaks. Go requires that
	// HTTP response bodies are always closed after reading, even if we don't read them.
	// defer ensures this happens when handleDeliver returns, regardless of the return path.
	defer driveResp.Body.Close()

	// Check if the Google Apps Script returned a non-success HTTP status code.
	// A success is any status in the 2xx range (200-299).
	if driveResp.StatusCode < 200 || driveResp.StatusCode > 299 {
		// Read the full response body for logging purposes — it may contain an error message
		// from the Apps Script that helps diagnose the issue.
		body, _ := io.ReadAll(driveResp.Body)
		// Log the HTTP status code and response body for server-side debugging.
		log.Printf("[deliver] Drive upload HTTP %d: %s", driveResp.StatusCode, string(body))
		// Respond with HTTP 502 Bad Gateway — the upstream Drive service returned an error.
		c.JSON(http.StatusBadGateway, gin.H{"error": "drive upload failed"})
		// Return early — the Drive upload failed so we don't proceed to the webhook step.
		return
	}

	// ── Step 2: Notify webhook with {email, documentId} ──
	// Now that the document is safely uploaded to Google Drive, notify the webhook
	// service so it can trigger an email to the user with a link to their document.
	// Prepare the webhook JSON payload containing the user's email and the document ID.
	webhookPayload, _ := json.Marshal(map[string]string{
		"email":      req.Email,  // The user's email address for the delivery notification
		"documentId": documentId, // The document ID so the webhook can construct the Drive link
	})

	// Send an HTTP POST request to the webhook URL (e.g., a Make.com webhook endpoint).
	// Content-Type is "application/json" because webhook services expect standard JSON.
	webhookResp, err := http.Post(webhookURL, "application/json", bytes.NewReader(webhookPayload))
	// Check if the HTTP request to the webhook service failed at the network level.
	if err != nil {
		// Log the network error for debugging.
		log.Printf("[deliver] Webhook error: %v", err)
		// The file IS already uploaded to Google Drive successfully (Step 1 passed),
		// so we return a partial success: HTTP 200 with the documentId plus a warning
		// that the email notification failed. The user's document is safe on Drive.
		c.JSON(http.StatusOK, gin.H{"documentId": documentId, "warning": "webhook notification failed"})
		// Return — the response has been sent (partial success).
		return
	}
	// Defer closing the webhook response body to prevent resource leaks.
	defer webhookResp.Body.Close()

	// Check if the webhook service returned a non-success HTTP status code (outside 2xx range).
	if webhookResp.StatusCode < 200 || webhookResp.StatusCode > 299 {
		// Read the response body for diagnostic logging.
		body, _ := io.ReadAll(webhookResp.Body)
		// Log the webhook's HTTP status and response body for debugging.
		log.Printf("[deliver] Webhook HTTP %d: %s", webhookResp.StatusCode, string(body))
		// Again, partial success — file is on Drive, but webhook notification failed.
		// Return HTTP 200 with a warning so the frontend knows the document was uploaded
		// but the email may not have been sent.
		c.JSON(http.StatusOK, gin.H{"documentId": documentId, "warning": "webhook notification failed"})
		// Return — partial success response sent.
		return
	}

	// Both steps succeeded — log the successful delivery for auditing and monitoring.
	// Includes the document ID and email for traceability in server logs.
	log.Printf("[deliver] Document %s delivered for %s", documentId, req.Email)
	// Respond with HTTP 200 OK and the document ID. The frontend can use this ID
	// to display a confirmation message or reference number to the user.
	c.JSON(http.StatusOK, gin.H{"documentId": documentId})
}

// handleMethodologyRequest handles POST /api/methodology-request requests.
// This handler receives a user's email and a list of methodology categories,
// then forwards the entire payload to an external Make.com webhook. The webhook
// triggers an automated workflow that compiles the requested methodology documents
// and sends them to the user's email address. This is simpler than the deliver
// handler because it doesn't involve a two-step upload + notification process —
// the webhook service handles everything in one go.
func handleMethodologyRequest(c *gin.Context) {
	// Declare a variable to hold the parsed request body.
	var req MethodologyRequest
	// ShouldBindJSON parses the JSON body and validates it:
	// - Email must be present and valid (binding:"required,email")
	// - Categories must be present and have at least one element (binding:"required,min=1")
	if err := c.ShouldBindJSON(&req); err != nil {
		// Respond with HTTP 400 Bad Request if validation fails, including the error details.
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		// Return early — invalid request, do not proceed.
		return
	}

	// Read the methodology webhook URL from the environment.
	// This is a separate webhook from the delivery webhook because methodology requests
	// trigger a different automated workflow (different email template, different attachments).
	webhookURL := os.Getenv("METHODOLOGY_WEBHOOK_URL")
	// Check if the webhook URL is configured. If not, the methodology service cannot function.
	if webhookURL == "" {
		// Log the missing configuration for server operators.
		log.Println("[methodology] METHODOLOGY_WEBHOOK_URL not configured")
		// Respond with HTTP 503 Service Unavailable — the methodology service dependency is missing.
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "methodology service not configured"})
		// Return early — cannot proceed without the webhook URL.
		return
	}

	// Prepare the JSON payload to send to the Make.com webhook.
	// We use map[string]interface{} (instead of map[string]string) because the "categories"
	// value is a []string slice, not a plain string — interface{} can hold any type.
	// json.Marshal converts this map into a JSON byte slice like:
	// {"email":"user@example.com","categories":["prestation_compensatoire","pension_alimentaire"]}
	payload, _ := json.Marshal(map[string]interface{}{
		"email":      req.Email,      // The user's email address for methodology document delivery
		"categories": req.Categories, // The list of methodology categories the user selected
	})

	// Send an HTTP POST request to the methodology webhook URL with the JSON payload.
	// Content-Type is "application/json" as expected by Make.com webhook endpoints.
	resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(payload))
	// Check if the HTTP request failed at the network level.
	if err != nil {
		// Log the network error for debugging.
		log.Printf("[methodology] Webhook error: %v", err)
		// Respond with HTTP 502 Bad Gateway — our server couldn't reach the webhook service.
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to send methodology request"})
		// Return early — the webhook call failed.
		return
	}
	// Defer closing the response body to prevent resource leaks.
	defer resp.Body.Close()

	// Check if the webhook returned a non-success status code (outside 2xx range).
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		// Read the response body for diagnostic logging.
		body, _ := io.ReadAll(resp.Body)
		// Log the webhook's HTTP status and response body for debugging.
		log.Printf("[methodology] Webhook HTTP %d: %s", resp.StatusCode, string(body))
		// Respond with HTTP 502 Bad Gateway — the webhook service returned an error.
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to send methodology request"})
		// Return — error response sent.
		return
	}

	// The webhook call succeeded — log it for auditing. Includes the email and
	// the number of categories requested for monitoring/analytics purposes.
	log.Printf("[methodology] Request sent for %s (%d categories)", req.Email, len(req.Categories))
	// Respond with HTTP 200 OK and a simple status message confirming success.
	// The frontend will display a confirmation to the user that their request has been submitted.
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
