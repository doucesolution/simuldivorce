/**
 * Google Apps Script — Drive Upload Endpoint
 *
 * This script is deployed as a Google Apps Script Web App.
 * It receives a .docx file via POST and saves it to a Google Drive folder.
 *
 * ─────────────────────────────────────────────────────
 *  SETUP INSTRUCTIONS
 * ─────────────────────────────────────────────────────
 *
 *  1. Go to https://script.google.com and create a new project
 *  2. Paste this entire file content into Code.gs
 *  3. Replace FOLDER_ID below with your Google Drive folder ID
 *     (the folder ID is the last part of the URL when you open the folder:
 *      https://drive.google.com/drive/folders/XXXXXXXXXXXXXXX )
 *  4. Click "Deploy" → "New deployment"
 *  5. Type: "Web app"
 *  6. Execute as: "Me" (your Google account)
 *  7. Who has access: "Anyone"
 *  8. Click "Deploy" and authorize
 *  9. Copy the Web App URL and paste it as DRIVE_UPLOAD_URL in
 *     frontend/src/services/webhookService.ts
 *
 * ─────────────────────────────────────────────────────
 */

// 🔧 Replace with your Google Drive folder ID.
// This is the target folder where uploaded .docx files will be saved.
// You can find the folder ID in the URL when you open the folder in Google Drive
// (the long alphanumeric string after /folders/).
// Using `var` (not `const`/`let`) because Google Apps Script uses the older
// Rhino/V8-legacy runtime where `var` is the safest top-level declaration.
var FOLDER_ID = "PASTE_YOUR_FOLDER_ID_HERE";

/**
 * Handle POST requests from the frontend.
 *
 * The frontend sends Content-Type: text/plain with a JSON body:
 *   { fileBase64: "...", documentId: "abc123" }
 *
 * (text/plain is used instead of application/json to avoid CORS preflight
 *  issues with Google Apps Script Web Apps — a "simple request" with
 *  text/plain skips the OPTIONS preflight that GAS cannot handle.)
 *
 * @param {Object} e  The event object provided by Google Apps Script.
 *                     e.postData.contents holds the raw request body as a string.
 * @returns {TextOutput} A JSON response indicating success or failure.
 */
function doPost(e) {
  // Wrap everything in a try/catch so any unexpected error is returned as a
  // structured JSON response rather than an opaque 500 from Google's servers.
  try {
    // Obtain a reference to the target Google Drive folder using its ID.
    // DriveApp is a built-in GAS service that provides access to Google Drive.
    var folder = DriveApp.getFolderById(FOLDER_ID);

    // Parse the raw POST body (a JSON string) into a JavaScript object.
    // e.postData.contents is the full text body sent by the frontend.
    var json = JSON.parse(e.postData.contents);

    // Extract the document identifier from the request; default to "document"
    // if the caller did not provide one.  This value is used as the filename.
    var documentId = json.documentId || "document";

    // Extract the base64-encoded .docx file content from the parsed JSON body.
    var fileBase64 = json.fileBase64;

    // If no file data was provided, return an error response immediately.
    // This guards against malformed or empty requests.
    if (!fileBase64) {
      // Build a JSON error response using ContentService.
      // ContentService.createTextOutput creates a plain-text HTTP response,
      // and setMimeType(JSON) sets the Content-Type header to application/json.
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "No fileBase64 in request body",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Decode the base64 string into a byte array, then wrap it in a Blob.
    // Utilities.base64Decode converts the base64 string → byte[].
    // Utilities.newBlob wraps those bytes with a MIME type and a filename,
    // producing an object that DriveApp can store as a file.
    // The MIME type corresponds to a Microsoft Word .docx file
    // ("application/vnd.openxmlformats-officedocument.wordprocessingml.document").
    var fileBlob = Utilities.newBlob(
      Utilities.base64Decode(fileBase64), // Decode base64 → raw bytes
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // MIME type for .docx files
      documentId + ".docx", // Filename: <documentId>.docx
    );

    // Save the Blob as a new file inside the target Google Drive folder.
    // folder.createFile returns a File object representing the newly created file.
    var file = folder.createFile(fileBlob);

    // Return a JSON success response containing the new file's metadata:
    //   - fileId:   the unique Google Drive file ID (useful for API calls)
    //   - fileName: the name of the file as stored in Drive
    //   - url:      a shareable link to open/download the file
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true, // Indicates the upload completed without errors
        fileId: file.getId(), // Google Drive file ID for future reference
        fileName: file.getName(), // The filename as saved in Drive (e.g. "abc123.docx")
        url: file.getUrl(), // Direct URL to the file in Google Drive
      }),
    ).setMimeType(ContentService.MimeType.JSON); // Set response Content-Type to application/json
  } catch (err) {
    // If anything went wrong (invalid JSON, bad folder ID, quota exceeded, etc.),
    // catch the error and return it as a structured JSON response so the frontend
    // can display a meaningful message instead of a generic failure.
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() }), // Serialize the error message
    ).setMimeType(ContentService.MimeType.JSON); // Set response Content-Type to application/json
  }
}

/**
 * Handle GET requests (just for testing the deployment).
 *
 * When you open the Web App URL in a browser, it sends a GET request.
 * This handler returns a simple JSON status message confirming the
 * endpoint is alive and reachable — useful for smoke-testing after deploy.
 *
 * @returns {TextOutput} A JSON response with a status message.
 */
function doGet() {
  // Return a minimal JSON payload so the caller (or a browser) can verify
  // that the script is deployed and responding correctly.
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ok", // Simple health-check indicator
      message: "SimulDivorce Drive Upload endpoint is running.", // Human-readable confirmation
    }),
  ).setMimeType(ContentService.MimeType.JSON); // Set response Content-Type to application/json
}
