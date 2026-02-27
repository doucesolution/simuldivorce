/**
 * Document delivery service — proxied through Go backend.
 *
 * The frontend sends the .docx (base64) + email to /api/deliver.
 * The backend handles Drive upload + webhook notification securely
 * (no third-party URLs or secrets exposed to the client).
 */

// Read the backend API base URL from the Vite environment variable VITE_API_URL.
// Falls back to empty string (same-origin) when not set, which works in production
// where the frontend is served behind the same reverse proxy as the Go backend.
const API_BASE = import.meta.env.VITE_API_URL || "";

// ── Helpers ──────────────────────────────────────────────────

/** Convert a Blob to a base64 string (no data-url prefix). */
// This is needed because the backend /api/deliver endpoint expects the Word
// document as a base64-encoded string in the JSON body, not as a binary upload.
async function blobToBase64(blob: Blob): Promise<string> {
  // Wrap the FileReader callback API in a Promise for async/await usage
  return new Promise((resolve, reject) => {
    // Create a FileReader instance to read the blob contents
    const reader = new FileReader();
    // When reading completes, extract the base64 portion from the data URL.
    // FileReader.readAsDataURL produces "data:<mime>;base64,<data>" — we only want <data>.
    reader.onloadend = () => {
      // Cast result to string (it's always a string when using readAsDataURL)
      const dataUrl = reader.result as string;
      // Split on the comma to strip the "data:...;base64," prefix, keeping only the encoded payload
      resolve(dataUrl.split(",")[1] || "");
    };
    // Forward any read errors to the Promise rejection handler
    reader.onerror = reject;
    // Start reading the blob as a data URL (triggers onloadend when done)
    reader.readAsDataURL(blob);
  });
}

// ── Public API ───────────────────────────────────────────────

/**
 * Deliver a Word document:
 *   1. Convert blob to base64
 *   2. POST to /api/deliver with { fileBase64, email }
 *   3. Backend handles Drive upload + webhook
 *
 * Returns the documentId on success.
 */
// Main function called by the export page after generating a .docx Word document.
// Takes the raw blob and the recipient's email, sends both to the Go backend.
// The backend uploads the document to Google Drive and notifies via webhook.
export async function deliverDocument(
  blob: Blob, // The generated Word document as a binary Blob
  email: string, // Recipient email address for the delivery notification
): Promise<string> {
  // Convert the binary blob to a base64 string suitable for JSON transport
  const fileBase64 = await blobToBase64(blob);

  // POST the base64-encoded document and email to the backend delivery endpoint
  const response = await fetch(`${API_BASE}/api/deliver`, {
    method: "POST", // Use POST since we're sending a payload
    headers: { "Content-Type": "application/json" }, // Tell the server we're sending JSON
    body: JSON.stringify({ fileBase64, email }), // Serialize the payload as JSON
  });

  // If the server responded with a non-2xx status, throw an error with details
  if (!response.ok) {
    // Try to read the error body for a more descriptive error message
    const body = await response.text().catch(() => "");
    // Throw a descriptive error including the HTTP status code and server response
    throw new Error(`Delivery failed (HTTP ${response.status}): ${body}`);
  }

  // Parse the successful JSON response from the backend
  const data = await response.json();
  // Return the document ID assigned by the backend (used for tracking/confirmation).
  // Falls back to empty string if documentId is missing from the response.
  return data.documentId ?? "";
}

/**
 * Returns true when the delivery backend is available.
 * (Always true when API_BASE is set or in production behind proxy.)
 */
// Currently always returns true because the backend is expected to be available
// in all deployment scenarios (dev via VITE_API_URL, prod via reverse proxy).
// Could be extended later to perform a health check against the backend.
export function isDeliveryConfigured(): boolean {
  return true;
}
