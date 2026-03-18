// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UniformTypeIdentifiers

enum UploadType: Int, Enumerable {
  case binaryContent = 0
  case multipart = 1
}

/**
 * A record type for upload options.
 */
struct UploadTaskOptions: Record {
  @Field var headers: [String: String]?
  @Field var httpMethod: String = "POST"
  @Field var uploadType: UploadType = .binaryContent
  @Field var fieldName: String?
  @Field var mimeType: String?
  @Field var parameters: [String: String]?
}

/**
 * A record type for upload result.
 */
struct UploadTaskResult: Record {
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
  private var tempFileURL: URL?
  private var lastProgressTime: TimeInterval = 0
  private let progressThrottleInterval: TimeInterval = 0.1 // 100ms

  func start(url: URL, file: FileSystemFile, options: UploadTaskOptions, promise: Promise) {
    let sourceUrl = file.url

    do {
      // Create the delegate
      delegate = UploadTaskDelegate(sharedObject: self, promise: promise)

      // Create the session
      let configuration = URLSessionConfiguration.default
      configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
      configuration.urlCache = nil
      session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)

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
      if options.uploadType == .multipart {
        let boundaryString = UUID().uuidString
        let bodyFileURL = try createMultipartBody(boundary: boundaryString, sourceUrl: sourceUrl, options: options)

        request.setValue("multipart/form-data; boundary=\(boundaryString)", forHTTPHeaderField: "Content-Type")
        tempFileURL = bodyFileURL

        uploadTask = session.uploadTask(with: request, fromFile: bodyFileURL)
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

  fileprivate func emitProgress(bytesSent: Int64, totalBytes: Int64) {
    let currentTime = Date().timeIntervalSince1970
    let shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval || bytesSent == totalBytes

    if shouldEmit {
      lastProgressTime = currentTime
      emit(event: "progress", arguments: [
        "bytesSent": bytesSent,
        "totalBytes": totalBytes
      ])
    }
  }

  private func cleanup() {
    delegate = nil
    uploadTask = nil
    session?.invalidateAndCancel()
    session = nil
    if let tempFileURL = tempFileURL {
      try? FileManager.default.removeItem(at: tempFileURL)
      self.tempFileURL = nil
    }
  }

  // MARK: - Helper methods

  private func createLocalUrl(from sourceUrl: URL, uniqueName: String? = nil) throws -> URL {
    guard let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
      throw UploadFailedToAccessCacheException()
    }
    let tempDir = cachesDir.appendingPathComponent("uploads")
    FileSystemUtilities.ensureDirExists(at: tempDir)
    let filename = uniqueName ?? sourceUrl.lastPathComponent
    return tempDir.appendingPathComponent(filename)
  }

  private func createMultipartBody(boundary: String, sourceUrl: URL, options: UploadTaskOptions) throws -> URL {
    let fieldName = options.fieldName ?? sourceUrl.lastPathComponent
    let mimeType = options.mimeType ?? findMimeType(forAttachment: sourceUrl)

    // Use UUID-based filename to avoid collision on concurrent uploads of same-named files
    let tempURL = try createLocalUrl(from: sourceUrl, uniqueName: UUID().uuidString)

    guard let output = OutputStream(url: tempURL, append: false) else {
      throw UploadFailedToAccessCacheException()
    }
    output.open()
    defer { output.close() }

    // Write parameter parts
    if let params = options.parameters {
      for (key, value) in params {
        let part = "--\(boundary)\r\nContent-Disposition: form-data; name=\"\(key)\"\r\n\r\n\(value)\r\n"
        let partData = Array(part.utf8)
        output.write(partData, maxLength: partData.count)
      }
    }

    // Write file part header
    let header = "--\(boundary)\r\nContent-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(sourceUrl.lastPathComponent)\"\r\nContent-Type: \(mimeType)\r\n\r\n"
    let headerData = Array(header.utf8)
    output.write(headerData, maxLength: headerData.count)

    // Stream file content in 64KB chunks
    guard let input = InputStream(url: sourceUrl) else {
      throw UploadFailedToCreateBodyException()
    }
    input.open()
    defer { input.close() }

    let bufferSize = 65536
    let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
    defer { buffer.deallocate() }

    while input.hasBytesAvailable {
      let bytesRead = input.read(buffer, maxLength: bufferSize)
      if bytesRead > 0 {
        output.write(buffer, maxLength: bytesRead)
      } else if bytesRead < 0 {
        throw UploadFailedToCreateBodyException()
      }
    }

    // Write closing boundary
    let closing = "\r\n--\(boundary)--\r\n"
    let closingData = Array(closing.utf8)
    output.write(closingData, maxLength: closingData.count)

    return tempURL
  }

  private func findMimeType(forAttachment attachment: URL) -> String {
    return UTType(filenameExtension: attachment.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
  }
}

// MARK: - Upload Task Delegate

class UploadTaskDelegate: NSObject, URLSessionTaskDelegate, URLSessionDataDelegate {
  private weak var sharedObject: FileSystemUploadTask?
  private let promise: Promise
  private var responseBody = Data()
  private var settled = false

  init(sharedObject: FileSystemUploadTask, promise: Promise) {
    self.sharedObject = sharedObject
    self.promise = promise
    super.init()
  }

  // Progress tracking
  func urlSession(_ session: URLSession,
                  task: URLSessionTask,
                  didSendBodyData bytesSent: Int64,
                  totalBytesSent: Int64,
                  totalBytesExpectedToSend: Int64) {
    sharedObject?.emitProgress(bytesSent: totalBytesSent, totalBytes: totalBytesExpectedToSend)
  }

  // Collect response body
  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    responseBody.append(data)
  }

  // Completion
  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard !settled else {
      session.finishTasksAndInvalidate()
      return
    }
    settled = true

    if let error = error {
      let nsError = error as NSError
      if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
        promise.reject(UploadCancelledException())
      } else {
        promise.reject(UnableToUploadException(error.localizedDescription))
      }

      // Invalidate session to break retain cycle (delegate → session → delegate)
      session.finishTasksAndInvalidate()
      return
    }

    guard let httpResponse = task.response as? HTTPURLResponse else {
      promise.reject(UnableToUploadException("No HTTP response received"))

      // Invalidate session to break retain cycle (delegate → session → delegate)
      session.finishTasksAndInvalidate()
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

    // Invalidate session to break retain cycle (delegate → session → delegate)
    session.finishTasksAndInvalidate()
  }
}
