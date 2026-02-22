// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 * A record type for download task options.
 */
struct DownloadTaskOptions: Record {
  @Field var headers: [String: String]?
}

/**
 * A SharedObject that handles file downloads with pause/resume support and progress tracking.
 */
class FileSystemDownloadTask: SharedObject {
  private var session: URLSession?
  private var downloadTask: URLSessionDownloadTask?
  private var delegate: DownloadTaskDelegate?
  var isPausing = false // Made internal so delegate can access it
  private var destinationPath: FileSystemPath?

  func start(url: URL, to: FileSystemPath, options: DownloadTaskOptions?, promise: Promise) {
    isPausing = false
    destinationPath = to

    // Create the delegate
    delegate = DownloadTaskDelegate(sharedObject: self, destination: to, promise: promise)

    // Create the session
    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    configuration.urlCache = nil
    session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: .main)

    guard let session = session else {
      promise.reject(UnableToDownloadException("Failed to create URLSession"))
      return
    }

    // Build the request
    var request = URLRequest(url: url)
    if let headers = options?.headers {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }

    // Create and start download task
    downloadTask = session.downloadTask(with: request)
    downloadTask?.resume()
  }

  func pause() async -> [String: String?] {
    isPausing = true
    guard let downloadTask = downloadTask else {
      return ["resumeData": nil]
    }

    let resumeData = await downloadTask.cancelByProducingResumeData()
    return ["resumeData": resumeData?.base64EncodedString()]
  }

  func resume(url: URL, to: FileSystemPath, resumeData: String, options: DownloadTaskOptions?, promise: Promise) {
    isPausing = false
    destinationPath = to

    guard let data = Data(base64Encoded: resumeData) else {
      promise.reject(InvalidResumeDataException())
      return
    }

    // Create the delegate
    delegate = DownloadTaskDelegate(sharedObject: self, destination: to, promise: promise)

    // Create the session
    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    configuration.urlCache = nil
    session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: .main)

    guard let session = session else {
      promise.reject(UnableToDownloadException("Failed to create URLSession"))
      return
    }

    // Build the request with headers (for the resume attempt)
    // Note: URLSession handles the Range header automatically with resume data

    // Create and start download task from resume data
    downloadTask = session.downloadTask(withResumeData: data)
    downloadTask?.resume()
  }

  func cancel() {
    isPausing = false
    downloadTask?.cancel()
    cleanup()
  }

  override func sharedObjectWillRelease() {
    downloadTask?.cancel()
    session?.invalidateAndCancel()
    cleanup()
  }

  private func cleanup() {
    delegate = nil
    downloadTask = nil
    session?.invalidateAndCancel()
    session = nil
  }
}

// MARK: - Download Task Delegate

class DownloadTaskDelegate: NSObject, URLSessionDownloadDelegate {
  private weak var sharedObject: FileSystemDownloadTask?
  private let destination: FileSystemPath
  private let promise: Promise
  private var lastProgressTime: TimeInterval = 0
  private let progressThrottleInterval: TimeInterval = 0.1 // 100ms

  init(sharedObject: FileSystemDownloadTask, destination: FileSystemPath, promise: Promise) {
    self.sharedObject = sharedObject
    self.destination = destination
    self.promise = promise
    super.init()
  }

  // Progress tracking
  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  ) {
    let currentTime = Date().timeIntervalSince1970
    let shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval || totalBytesWritten == totalBytesExpectedToWrite

    if shouldEmit {
      lastProgressTime = currentTime
      sharedObject?.emit(event: "progress", arguments: [
        "bytesWritten": totalBytesWritten,
        "totalBytes": totalBytesExpectedToWrite
      ])
    }
  }

  // Download completion
  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
    do {
      let destinationUrl: URL
      if let directory = destination as? FileSystemDirectory {
        // If destination is a directory, determine filename from response
        let httpResponse = downloadTask.response as? HTTPURLResponse
        let filename = httpResponse?.suggestedFilename ?? downloadTask.originalRequest?.url?.lastPathComponent ?? "download"
        destinationUrl = directory.url.appendingPathComponent(filename)
      } else {
        destinationUrl = destination.url
      }

      // Remove existing file if it exists
      if FileManager.default.fileExists(atPath: destinationUrl.path) {
        try FileManager.default.removeItem(at: destinationUrl)
      }

      // Move downloaded file to destination
      try FileManager.default.moveItem(at: location, to: destinationUrl)

      // Resolve promise with the destination URI
      promise.resolve(destinationUrl.absoluteString)
    } catch {
      promise.reject(UnableToDownloadException("Failed to move downloaded file: \(error.localizedDescription)"))
    }
  }

  // Task completion with error handling
  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      let nsError = error as NSError
      if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
        // Check if this was a pause operation
        if sharedObject?.isPausing == true {
          // Paused - resolve with nil to indicate pause (not an error)
          promise.resolve(nil)
        } else {
          // Cancelled but not paused - this is an error
          promise.reject(DownloadCancelledException())
        }
      } else {
        // Other error
        promise.reject(UnableToDownloadException(error.localizedDescription))
      }
    }
    // If error is nil, success is handled by didFinishDownloadingTo
  }
}
