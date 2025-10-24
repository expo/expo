import Foundation
import UIKit

private let LOG_TAG = "ScreenInspector"

// Helper to log with proper string conversion
private func log(_ message: String) {
    message.withCString { c_syslog($0) }
}

@objc public class ScreenInspector: NSObject {
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
            // Open request pipe - blocks until a writer connects
            log("[\(LOG_TAG)] Opening request pipe...")
            let requestFd = open(requestPipePath, O_RDONLY)
            guard requestFd != -1 else {
                let error = errno
                log("[\(LOG_TAG)] Failed to open request pipe, errno: \(error)")
                usleep(100000) // Wait before retrying
                continue
            }

            log("[\(LOG_TAG)] Request pipe opened, reading request...")

            // Read request - blocks until data arrives
            guard let requestData = readFromPipe(fd: requestFd) else {
                log("[\(LOG_TAG)] Read failed or EOF, closing pipe")
                close(requestFd)
                continue
            }

            close(requestFd)

            log("[\(LOG_TAG)] Received request: \(String(data: requestData, encoding: .utf8) ?? "invalid UTF8")")

            let response = processRequest(requestData)
            writeToPipe(responsePipePath, data: response)

            log("[\(LOG_TAG)] Sent response, ready for next request")
        }

        log("[\(LOG_TAG)] Server loop ended")
    }

    private func readFromPipe(fd: Int32) -> Data? {
        var buffer = [UInt8](repeating: 0, count: 4096)
        let bytesRead = read(fd, &buffer, buffer.count)

        guard bytesRead > 0 else {
            if bytesRead == 0 {
                log("[\(LOG_TAG)] EOF on pipe")
            } else {
                let error = errno
                log("[\(LOG_TAG)] Read error, errno: \(error)")
            }
            return nil
        }

        log("[\(LOG_TAG)] Read \(bytesRead) bytes from pipe")
        return Data(buffer.prefix(bytesRead))
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
        case "getCoordinates":
            return getElementCoordinates(accessibilityId: accessibilityId)

        default:
            return createErrorResponse("Unknown action: \(action)")
        }
    }

    private func getElementCoordinates(accessibilityId: String) -> Data {
        guard Thread.isMainThread else {
            var result: Data!
            DispatchQueue.main.sync {
                result = getElementCoordinates(accessibilityId: accessibilityId)
            }
            return result
        }

        guard let element = self.findElementByAccessibilityId(accessibilityId) else {
            return createErrorResponse("Element with accessibilityId '\(accessibilityId)' not found")
        }

        // Convert element bounds to window coordinates (**visible portion only!**)
        let frameInWindow = element.convert(element.bounds, to: nil)

        let response: [String: Any] = [
            "success": true,
            "description": element.description,
            "bounds": [
                "x": Int(frameInWindow.origin.x),
                "y": Int(frameInWindow.origin.y),
                "width": Int(frameInWindow.size.width),
                "height": Int(frameInWindow.size.height),
            ],
            "error": ""
        ]

        do {
            return try JSONSerialization.data(withJSONObject: response, options: [])
        } catch {
            return createErrorResponse("Failed to serialize coordinates: \(error.localizedDescription)")
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

private let screenInspector = ScreenInspector()

// Declare C function
@_silgen_name("c_syslog")
func c_syslog(_ message: UnsafePointer<CChar>)

@_cdecl("screen_inspector_dylib_init")
public func screen_inspector_dylib_init() {
    log("[\(LOG_TAG)] Dylib loaded! Starting screenInspector server...")
    screenInspector.start()
}
