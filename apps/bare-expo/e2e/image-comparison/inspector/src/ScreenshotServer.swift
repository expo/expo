import Foundation
import UIKit

private let LOG_TAG = "ScreenInspector"

// Helper to log with proper string conversion
private func log(_ message: String) {
    message.withCString { c_syslog($0) }
}

@objc public class ScreenshotServer: NSObject {
    private var isRunning = false
    private var serverQueue: DispatchQueue
    private let requestPipePath = "/tmp/ios_screen_inspector_request"
    private let responsePipePath = "/tmp/ios_screen_inspector_response"

    public override init() {
        self.serverQueue = DispatchQueue(label: "screenInspector.server", qos: .userInitiated)
        super.init()
    }

    @objc public func start() {
        guard !isRunning else {
            log("[\(LOG_TAG)] Server already running")
            return
        }
        isRunning = true

        log("[\(LOG_TAG)] Starting screenInspector server...")

        createPipes()

        // Start server in background thread using lower-level threading
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.runServer()
        }

        log("[\(LOG_TAG)] server started successfully")
    }

    @objc public func stop() {
        isRunning = false
        // Clean up pipes
        unlink(requestPipePath)
        unlink(responsePipePath)
    }

    private func createPipes() {
        log("[\(LOG_TAG)] Creating named pipes...")

        // Remove existing pipes
        unlink(requestPipePath)
        unlink(responsePipePath)

        // Create new pipes with more permissive permissions
        let requestResult = mkfifo(requestPipePath, 0o777)
        let responseResult = mkfifo(responsePipePath, 0o777)

        if requestResult != 0 {
            let error = errno
            log("[\(LOG_TAG)] Failed to create request pipe, errno: \(error)")
        } else {
            log("[\(LOG_TAG)] Created request pipe successfully")
        }

        if responseResult != 0 {
            let error = errno
            log("[\(LOG_TAG)] Failed to create response pipe, errno: \(error)")
        } else {
            log("[\(LOG_TAG)] Created response pipe successfully")
        }

        // Verify pipes exist on filesystem
        let requestExists = access(requestPipePath, F_OK) == 0
        let responseExists = access(responsePipePath, F_OK) == 0
        log("[\(LOG_TAG)] Request pipe exists on filesystem: \(requestExists)")
        log("[\(LOG_TAG)] Response pipe exists on filesystem: \(responseExists)")
    }

    private func runServer() {
        log("[\(LOG_TAG)] Server loop started, waiting for requests...")

        while isRunning {
            guard let requestData = readFromPipe(requestPipePath) else {
                // Wait a bit before trying again if pipe read fails
                usleep(100000) // 100ms
                continue
            }

            log("[\(LOG_TAG)] Received request: \(String(data: requestData, encoding: .utf8) ?? "invalid UTF8")")

            let response = processRequest(requestData)
            writeToPipe(responsePipePath, data: response)

            log("[\(LOG_TAG)] Sent response")
        }

        log("[\(LOG_TAG)] Server loop ended")
    }

    private func readFromPipe(_ path: String) -> Data? {
        let fd = open(path, O_RDONLY | O_NONBLOCK)
        guard fd != -1 else {
            let error = errno
            log("[\(LOG_TAG)] Failed to open pipe for reading, errno: \(error)")
            return nil
        }

        // Remove non-blocking flag after opening
        let flags = fcntl(fd, F_GETFL)
        let _ = fcntl(fd, F_SETFL, flags & ~O_NONBLOCK)

        log("[\(LOG_TAG)] Pipe opened successfully, attempting to read")
        defer {
            close(fd)
            log("[\(LOG_TAG)] Pipe closed")
        }

        var buffer = [UInt8](repeating: 0, count: 4096)
        let bytesRead = read(fd, &buffer, buffer.count)

        log("[\(LOG_TAG)] Read \(bytesRead) bytes from pipe")

        guard bytesRead > 0 else {
            return nil
        }

        let data = Data(buffer.prefix(bytesRead))
        log("[\(LOG_TAG)] Data read successfully")
        return data
    }

    private func writeToPipe(_ path: String, data: Data) {
        log("[\(LOG_TAG)] Attempting to open pipe for writing")

        let fd = open(path, O_WRONLY)
        guard fd != -1 else {
            log("[\(LOG_TAG)] Failed to open pipe for writing")
            return
        }

        log("[\(LOG_TAG)] Pipe opened for writing, sending \(data.count) bytes")
        defer {
            close(fd)
            log("[\(LOG_TAG)] Write pipe closed")
        }

        data.withUnsafeBytes { bytes in
            let written = write(fd, bytes.bindMemory(to: UInt8.self).baseAddress, data.count)
            log("[\(LOG_TAG)] Wrote \(written) bytes to pipe")
        }
    }

    private func processRequest(_ requestData: Data) -> Data {
        guard let json = try? JSONSerialization.jsonObject(with: requestData, options: []) as? [String: Any],
              let action = json["action"] as? String,
              let accessibilityId = json["accessibilityId"] as? String else {
            return createErrorResponse("Invalid request format")
        }

        switch action {
        case "viewshot":
            guard let outputPath = json["outputPath"] as? String else {
                return createErrorResponse("outputPath is required for viewshot action")
            }
            let captureMode = json["captureMode"] as? String ?? "full"
            return takeElementScreenshot(accessibilityId: accessibilityId, outputPath: outputPath, captureMode: captureMode)

        case "getCoordinates":
            return getElementCoordinates(accessibilityId: accessibilityId)

        default:
            return createErrorResponse("Unknown action: \(action)")
        }
    }

    private func getElementCoordinates(accessibilityId: String) -> Data {
        guard let element = self.findElementByAccessibilityId(accessibilityId) else {
            return createErrorResponse("Element with accessibilityId '\(accessibilityId)' not found")
        }

        let bounds = element.accessibilityFrame
        let response: [String: Any] = [
            "success": true,
            "bounds": [
                "x": Int(bounds.origin.x),
                "y": Int(bounds.origin.y),
                "width": Int(bounds.size.width),
                "height": Int(bounds.size.height)
            ],
            "error": ""
        ]

        do {
            return try JSONSerialization.data(withJSONObject: response, options: [])
        } catch {
            return createErrorResponse("Failed to serialize coordinates: \(error.localizedDescription)")
        }
    }

    private func takeElementScreenshot(accessibilityId: String, outputPath: String, captureMode: String) -> Data {
        guard let element = self.findElementByAccessibilityId(accessibilityId) else {
            return createErrorResponse("Element with accessibilityId '\(accessibilityId)' not found")
        }

        let screenshot: UIImage?
        if captureMode == "visible" {
            screenshot = self.captureElementBounds(element: element)
        } else {
            screenshot = self.captureElementScreenshot(element: element) // This tries full content first
        }

        guard let screenshot = screenshot else {
            return createErrorResponse("Failed to capture screenshot")
        }

        let url = URL(fileURLWithPath: outputPath)

        do {
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(),
                                                  withIntermediateDirectories: true,
                                                  attributes: nil)

            // Save screenshot
            guard let pngData = screenshot.pngData() else {
                return createErrorResponse("Failed to convert screenshot to PNG data")
            }
            try pngData.write(to: url)

            let bounds = element.accessibilityFrame
            let response: [String: Any] = [
                "success": true,
                "bounds": [
                    "x": Int(bounds.origin.x),
                    "y": Int(bounds.origin.y),
                    "width": Int(bounds.size.width),
                    "height": Int(bounds.size.height)
                ],
                "error": ""
            ]

            return try JSONSerialization.data(withJSONObject: response, options: [])
        } catch {
            return createErrorResponse("Failed to save screenshot: \(error.localizedDescription)")
        }
    }

    private func createErrorResponse(_ message: String) -> Data {
        let response: [String: Any] = [
            "success": false,
            "error": message
        ]

        do {
            return try JSONSerialization.data(withJSONObject: response, options: [])
        } catch {
            return Data("{\"success\": false, \"error\": \"JSON serialization failed\"}".utf8)
        }
    }
}

private let screenshotServer = ScreenshotServer()

// Declare C function
@_silgen_name("c_syslog")
func c_syslog(_ message: UnsafePointer<CChar>)

@_cdecl("screenshot_dylib_init")
public func screenshot_dylib_init() {
    log("[\(LOG_TAG)] Dylib loaded! Starting screenInspector server...")
    screenshotServer.start()
}
