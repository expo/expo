// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
import CoreServices

/**
 * A record type for upload options.
 */
struct UploadOptionsRecord: Record {
  @Field var headers: [String: String]?
  @Field var httpMethod: String = "POST"
  @Field var uploadType: Int = 0
  @Field var fieldName: String?
  @Field var mimeType: String?
  @Field var parameters: [String: String]?
}

/**
 * A record type for upload result.
 */
struct UploadResultRecord: Record {
  @Field var body: String
  @Field var status: Int
  @Field var headers: [String: String]
}

/**
 * A SharedObject that handles file uploads with progress tracking.
 */
class FileSystemUploadTask: SharedObject {
  private var session: URLSession?
  private var uploadTask: URLSessionUploadTask?
  private var delegate: UploadTaskDelegate?
  private var cancelled = false

  func start(url: URL, fileUri: String, options: UploadOptionsRecord, promise: Promise) {
    guard let sourceUrl = URL(string: fileUri) else {
      promise.reject(InvalidUrlException(fileUri))
      return
    }

    do {
      // Create the delegate
      delegate = UploadTaskDelegate(sharedObject: self, promise: promise)

      // Create the session
      let configuration = URLSessionConfiguration.default
      configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
      configuration.urlCache = nil
      session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: .main)

      guard let session = session else {
        promise.reject(UnableToUploadException("Failed to create URLSession"))
        return
      }

      // Build the request
      var request = URLRequest(url: url)
      request.httpMethod = options.httpMethod

      if let headers = options.headers {
        for (key, value) in headers {
          request.setValue(value, forHTTPHeaderField: key)
        }
      }

      // Create upload task based on upload type
      if options.uploadType == 1 { // Multipart
        let boundaryString = UUID().uuidString
        guard let data = createMultipartBody(boundary: boundaryString, sourceUrl: sourceUrl, options: options) else {
          promise.reject(FailedToCreateBodyException())
          return
        }

        request.setValue("multipart/form-data; boundary=\(boundaryString)", forHTTPHeaderField: "Content-Type")

        let localURL = try createLocalUrl(from: sourceUrl)
        try data.write(to: localURL)

        uploadTask = session.uploadTask(with: request, fromFile: localURL)
      } else { // Binary content
        uploadTask = session.uploadTask(with: request, fromFile: sourceUrl)
      }

      uploadTask?.resume()
    } catch {
      promise.reject(UnableToUploadException(error.localizedDescription))
    }
  }

  func cancel() {
    cancelled = true
    uploadTask?.cancel()
    cleanup()
  }

  override func sharedObjectWillRelease() {
    uploadTask?.cancel()
    session?.invalidateAndCancel()
    cleanup()
  }

  private func cleanup() {
    delegate = nil
    uploadTask = nil
    session?.invalidateAndCancel()
    session = nil
  }

  // MARK: - Helper methods

  private func createLocalUrl(from sourceUrl: URL) throws -> URL {
    guard let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
      throw FailedToAccessDirectoryException()
    }
    let tempDir = cachesDir.appendingPathComponent("uploads")
    FileSystemUtilities.ensureDirExists(at: tempDir)
    return tempDir.appendingPathComponent(sourceUrl.lastPathComponent)
  }

  private func createMultipartBody(boundary: String, sourceUrl: URL, options: UploadOptionsRecord) -> Data? {
    let fieldName = options.fieldName ?? sourceUrl.lastPathComponent
    let mimeType = options.mimeType ?? findMimeType(forAttachment: sourceUrl)
    guard let data = try? Data(contentsOf: sourceUrl) else {
      return nil
    }

    var body = Data()
    headersForMultipartParams(options.parameters, boundary: boundary, body: &body)

    body.append("--\(boundary)\r\n".data)
    body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(sourceUrl.lastPathComponent)\"\r\n".data)
    body.append("Content-Type: \(mimeType)\r\n\r\n".data)
    body.append(data)
    body.append("\r\n".data)
    body.append("--\(boundary)--\r\n".data)

    return body
  }

  private func headersForMultipartParams(_ params: [String: String]?, boundary: String, body: inout Data) {
    if let params {
      for (key, value) in params {
        body.append("--\(boundary)\r\n".data)
        body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data)
        body.append("\(value)\r\n".data)
      }
    }
  }

  private func findMimeType(forAttachment attachment: URL) -> String {
    if let identifier = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, attachment.pathExtension as CFString, nil)?.takeRetainedValue() {
      if let type = UTTypeCopyPreferredTagWithClass(identifier, kUTTagClassMIMEType)?.takeRetainedValue() {
        return type as String
      }
    }
    return "application/octet-stream"
  }
}

// MARK: - Upload Task Delegate

class UploadTaskDelegate: NSObject, URLSessionTaskDelegate, URLSessionDataDelegate {
  private weak var sharedObject: FileSystemUploadTask?
  private let promise: Promise
  private var responseBody = Data()
  private var lastProgressTime: TimeInterval = 0
  private let progressThrottleInterval: TimeInterval = 0.1 // 100ms

  init(sharedObject: FileSystemUploadTask, promise: Promise) {
    self.sharedObject = sharedObject
    self.promise = promise
    super.init()
  }

  // Progress tracking
  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didSendBodyData bytesSent: Int64,
    totalBytesSent: Int64,
    totalBytesExpectedToSend: Int64
  ) {
    let currentTime = Date().timeIntervalSince1970
    let shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval || totalBytesSent == totalBytesExpectedToSend

    if shouldEmit {
      lastProgressTime = currentTime
      sharedObject?.emit(event: "progress", arguments: [
        "bytesSent": totalBytesSent,
        "totalBytes": totalBytesExpectedToSend
      ])
    }
  }

  // Collect response body
  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    responseBody.append(data)
  }

  // Completion
  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      let nsError = error as NSError
      if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
        // Task was cancelled - resolve with nil instead of rejecting
        promise.resolve(nil)
      } else {
        promise.reject(UnableToUploadException(error.localizedDescription))
      }
      return
    }

    guard let httpResponse = task.response as? HTTPURLResponse else {
      promise.reject(UnableToUploadException("No HTTP response received"))
      return
    }

    let bodyString = String(data: responseBody, encoding: .utf8) ?? ""
    let headers = httpResponse.allHeaderFields.reduce(into: [String: String]()) { result, item in
      if let key = item.key as? String, let value = item.value as? String {
        result[key] = value
      }
    }

    let result: [String: Any] = [
      "body": bodyString,
      "status": httpResponse.statusCode,
      "headers": headers
    ]

    promise.resolve(result)
  }
}

// MARK: - String extension

private extension String {
  var data: Data { Data(self.utf8) }
}
