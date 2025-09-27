import Foundation
import UIKit

@objc public class ScreenshotServer: NSObject {
    private var isRunning = false
    private var serverQueue: DispatchQueue
    private let requestPipePath = "/tmp/ios_screenshot_request"
    private let responsePipePath = "/tmp/ios_screenshot_response"

    public override init() {
        self.serverQueue = DispatchQueue(label: "screenshot.server", qos: .userInitiated)
        super.init()
    }

    @objc public func start() {
        guard !isRunning else {
            c_syslog("[ScreenshotDylib] Server already running")
            return
        }
        isRunning = true

        c_syslog("[ScreenshotDylib] Starting screenshot server...")

        // Create named pipes
        createPipes()

        // Try synchronous approach first to see if async is the issue
        c_syslog("[ScreenshotDylib] About to start server loop synchronously")

        // Start server in background thread using lower-level threading
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            c_syslog("[ScreenshotDylib] Background thread started")
            self?.runServer()
        }

        c_syslog("[ScreenshotDylib] Screenshot server started successfully")
    }

    @objc public func stop() {
        isRunning = false
        // Clean up pipes
        unlink(requestPipePath)
        unlink(responsePipePath)
    }

    private func createPipes() {
        c_syslog("[ScreenshotDylib] Creating named pipes...")

        // Remove existing pipes
        unlink(requestPipePath)
        unlink(responsePipePath)

        // Create new pipes with more permissive permissions
        let requestResult = mkfifo(requestPipePath, 0o777)
        let responseResult = mkfifo(responsePipePath, 0o777)

        if requestResult != 0 {
            let error = errno
            c_syslog("[ScreenshotDylib] Failed to create request pipe, errno: \(error)")
        } else {
            c_syslog("[ScreenshotDylib] Created request pipe successfully")
        }

        if responseResult != 0 {
            let error = errno
            c_syslog("[ScreenshotDylib] Failed to create response pipe, errno: \(error)")
        } else {
            c_syslog("[ScreenshotDylib] Created response pipe successfully")
        }

        // Verify pipes exist on filesystem
        let requestExists = access(requestPipePath, F_OK) == 0
        let responseExists = access(responsePipePath, F_OK) == 0
        c_syslog("[ScreenshotDylib] Request pipe exists on filesystem: \(requestExists)")
        c_syslog("[ScreenshotDylib] Response pipe exists on filesystem: \(responseExists)")
    }

    private func runServer() {
        c_syslog("[ScreenshotDylib] Server loop started, waiting for requests...")

        while isRunning {
            guard let requestData = readFromPipe(requestPipePath) else {
                // Wait a bit before trying again if pipe read fails
                usleep(100000) // 100ms
                continue
            }

            c_syslog("[ScreenshotDylib] Received request: \(String(data: requestData, encoding: .utf8) ?? "invalid UTF8")")

            let response = processRequest(requestData)
            writeToPipe(responsePipePath, data: response)

            c_syslog("[ScreenshotDylib] Sent response")
        }

        c_syslog("[ScreenshotDylib] Server loop ended")
    }

    private func readFromPipe(_ path: String) -> Data? {
        let fd = open(path, O_RDONLY | O_NONBLOCK)
        guard fd != -1 else {
            let error = errno
            c_syslog("[ScreenshotDylib] Failed to open pipe for reading, errno: \(error)")
            return nil
        }

        // Remove non-blocking flag after opening
        let flags = fcntl(fd, F_GETFL)
        let _ = fcntl(fd, F_SETFL, flags & ~O_NONBLOCK)

        c_syslog("[ScreenshotDylib] Pipe opened successfully, attempting to read")
        defer {
            close(fd)
            c_syslog("[ScreenshotDylib] Pipe closed")
        }

        var buffer = [UInt8](repeating: 0, count: 4096)
        let bytesRead = read(fd, &buffer, buffer.count)

        c_syslog("[ScreenshotDylib] Read \(bytesRead) bytes from pipe")

        guard bytesRead > 0 else {
            return nil
        }

        let data = Data(buffer.prefix(bytesRead))
        c_syslog("[ScreenshotDylib] Data read successfully")
        return data
    }

    private func writeToPipe(_ path: String, data: Data) {
        c_syslog("[ScreenshotDylib] Attempting to open pipe for writing")

        let fd = open(path, O_WRONLY)
        guard fd != -1 else {
            c_syslog("[ScreenshotDylib] Failed to open pipe for writing")
            return
        }

        c_syslog("[ScreenshotDylib] Pipe opened for writing, sending \(data.count) bytes")
        defer {
            close(fd)
            c_syslog("[ScreenshotDylib] Write pipe closed")
        }

        data.withUnsafeBytes { bytes in
            let written = write(fd, bytes.bindMemory(to: UInt8.self).baseAddress, data.count)
            c_syslog("[ScreenshotDylib] Wrote \(written) bytes to pipe")
        }
    }

    private func processRequest(_ requestData: Data) -> Data {
        guard let json = try? JSONSerialization.jsonObject(with: requestData, options: []) as? [String: Any],
              let action = json["action"] as? String,
              let accessibilityId = json["accessibilityId"] as? String,
              let outputPath = json["outputPath"] as? String else {
            return createErrorResponse("Invalid request format")
        }

        guard action == "screenshot" else {
            return createErrorResponse("Unknown action: \(action)")
        }

        let captureMode = json["captureMode"] as? String ?? "full"
        return takeElementScreenshot(accessibilityId: accessibilityId, outputPath: outputPath, captureMode: captureMode)
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
            // Create directory if needed
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(),
                                                  withIntermediateDirectories: true,
                                                  attributes: nil)

            // Save screenshot
            try screenshot.pngData()?.write(to: url)

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
    // Use C syslog for better visibility
    c_syslog("[ScreenshotDylib] Dylib loaded! Starting screenshot server...")
    screenshotServer.start()
}
