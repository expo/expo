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
  @Field var sessionType: NetworkTaskSessionType = .background
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
  // Same cross-thread hazard as `FileSystemDownloadTask.downloadTask`: cleared on the URLSession delegate
  // queue when the upload completes, cancelled from the JS thread (including from the GC finalizer via
  // `sharedObjectWillRelease`), so the optional is guarded by a lock and detached atomically for cancel.
  private let stateLock = NSLock()
  private var unsafeUploadTask: URLSessionUploadTask?
  private var uploadTask: URLSessionUploadTask? {
    get {
      stateLock.lock()
      defer { stateLock.unlock() }
      return unsafeUploadTask
    }
    set {
      stateLock.lock()
      defer { stateLock.unlock() }
      unsafeUploadTask = newValue
    }
  }
  private var delegateKey: String?
  private var sessionType: NetworkTaskSessionType = .background
  private var sourceAccess: FileSystemScopedAccess?
  private var cancelled = false
  private var tempFileURL: URL?
  private var lastProgressTime: TimeInterval = 0
  private let progressThrottleInterval: TimeInterval = 0.1 // 100ms

  func start(url: URL, file: FileSystemFile, options: UploadTaskOptions, promise: Promise) {
    let sourceUrl = file.url
    cancelled = false
    sessionType = options.sessionType

    do {
      let session = NetworkTaskSessionManager.shared.session(for: sessionType)

      sourceAccess = try makeScopedAccess(for: file, permission: .read)

      var request = URLRequest(url: url)
      request.httpMethod = options.httpMethod

      if let headers = options.headers {
        for (key, value) in headers {
          request.setValue(value, forHTTPHeaderField: key)
        }
      }

      if options.uploadType == .multipart {
        let boundaryString = UUID().uuidString
        let bodyFileURL = try createMultipartBody(boundary: boundaryString, sourceUrl: sourceUrl, options: options)

        request.setValue("multipart/form-data; boundary=\(boundaryString)", forHTTPHeaderField: "Content-Type")
        tempFileURL = bodyFileURL

        uploadTask = session.uploadTask(with: request, fromFile: bodyFileURL)
      } else {
        uploadTask = session.uploadTask(with: request, fromFile: sourceUrl)
      }

      guard let uploadTask else {
        promise.reject(UnableToUploadException("Failed to create upload task"))
        cleanup()
        return
      }

      let delegate = UploadTaskDelegate(sharedObject: self, promise: promise) {
        self.finishTask()
      }
      delegateKey = NetworkTaskSessionManager.shared.register(delegate: delegate, for: uploadTask, in: session)

      guard !cancelled else {
        NetworkTaskSessionManager.shared.unregister(key: delegateKey)
        promise.reject(UploadCancelledException())
        cleanup()
        return
      }

      uploadTask.resume()
    } catch {
      promise.reject(UnableToUploadException(error.localizedDescription))
      cleanup(unregisterDelegate: true)
    }
  }

  func cancel() {
    cancelled = true
    takeUploadTask()?.cancel()
  }

  override func sharedObjectWillRelease() {
    takeUploadTask()?.cancel()
  }

  /**
   Atomically detaches the underlying task so exactly one caller gets to cancel it, even when the
   delegate queue is clearing it at the same moment.
   */
  private func takeUploadTask() -> URLSessionUploadTask? {
    stateLock.lock()
    defer { stateLock.unlock() }
    let task = unsafeUploadTask
    unsafeUploadTask = nil
    return task
  }

  fileprivate func emitProgress(bytesSent: Int64, totalBytes: Int64) {
    let currentTime = Date().timeIntervalSince1970
    let shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval || bytesSent == totalBytes

    if shouldEmit {
      lastProgressTime = currentTime
      emit(event: "progress", payload: [
        "bytesSent": bytesSent,
        "totalBytes": totalBytes
      ])
    }
  }

  // Internal (not fileprivate) to mirror `FileSystemDownloadTask.finishTask`.
  func finishTask() {
    cleanup()
  }

  fileprivate func cleanup(unregisterDelegate: Bool = false) {
    if unregisterDelegate {
      NetworkTaskSessionManager.shared.unregister(key: delegateKey)
    }
    delegateKey = nil
    uploadTask = nil
    sourceAccess = nil
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

  private func writeAll(_ output: OutputStream, _ buffer: UnsafePointer<UInt8>, length: Int) throws {
    var offset = 0
    while offset < length {
      let written = output.write(buffer.advanced(by: offset), maxLength: length - offset)
      if written <= 0 {
        throw UploadFailedToCreateBodyException()
      }
      offset += written
    }
  }

  private func writeAll(_ output: OutputStream, _ data: [UInt8]) throws {
    try data.withUnsafeBufferPointer { buffer in
      guard let baseAddress = buffer.baseAddress else {
        return
      }
      try writeAll(output, baseAddress, length: data.count)
    }
  }

  private func createMultipartBody(boundary: String, sourceUrl: URL, options: UploadTaskOptions) throws -> URL {
    let fieldName = options.fieldName ?? sourceUrl.lastPathComponent
    let mimeType = options.mimeType ?? findMimeType(forAttachment: sourceUrl)

    // Use UUID-based filename to avoid collision on concurrent uploads of same-named files
    let tempURL = try createLocalUrl(from: sourceUrl, uniqueName: UUID().uuidString)
    var completed = false
    defer {
      if !completed {
        try? FileManager.default.removeItem(at: tempURL)
      }
    }

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
        try writeAll(output, partData)
      }
    }

    // Write file part header
    let header = "--\(boundary)\r\nContent-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(sourceUrl.lastPathComponent)\"\r\nContent-Type: \(mimeType)\r\n\r\n"
    let headerData = Array(header.utf8)
    try writeAll(output, headerData)

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
        try writeAll(output, buffer, length: bytesRead)
      } else if bytesRead < 0 {
        throw UploadFailedToCreateBodyException()
      }
    }

    // Write closing boundary
    let closing = "\r\n--\(boundary)--\r\n"
    let closingData = Array(closing.utf8)
    try writeAll(output, closingData)

    completed = true
    return tempURL
  }

  private func findMimeType(forAttachment attachment: URL) -> String {
    return UTType(filenameExtension: attachment.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
  }
}

// MARK: - Upload Task Delegate

class UploadTaskDelegate: NSObject, NetworkTaskDelegate {
  private weak var sharedObject: FileSystemUploadTask?
  private let promise: Promise
  private let finishTask: () -> Void
  private var responseBody = Data()
  private var settled = false

  init(sharedObject: FileSystemUploadTask, promise: Promise, finishTask: @escaping () -> Void) {
    self.sharedObject = sharedObject
    self.promise = promise
    self.finishTask = finishTask
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
      return
    }
    settled = true

    defer {
      finishTask()
    }

    if let error = error {
      let nsError = error as NSError
      if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
        promise.reject(UploadCancelledException())
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
