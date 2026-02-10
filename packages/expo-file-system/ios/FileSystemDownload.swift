// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Manages active download tasks and their delegates.
/// Used by `FileSystemModule` to track downloads that support progress reporting and cancellation.
@available(iOS 14, tvOS 14, *)
class DownloadTaskStore {
  private var tasks: [String: URLSessionDownloadTask] = [:]
  private var delegates: [String: DownloadDelegate] = [:]

  func store(task: URLSessionDownloadTask, delegate: DownloadDelegate, forUuid uuid: String) {
    tasks[uuid] = task
    delegates[uuid] = delegate
  }

  func cancel(uuid: String) {
    tasks[uuid]?.cancel()
  }

  func remove(uuid: String) {
    tasks.removeValue(forKey: uuid)
    delegates.removeValue(forKey: uuid)
  }
}

// MARK: - downloadFileWithStore

/// Executes a file download with optional progress reporting and cancellation.
///
/// When `downloadUuid` is non-nil, uses a delegate-based `URLSession` that reports progress
/// and supports cancellation via the `downloadStore`. When nil, uses `URLSession.shared` with
/// a simple completion handler.
@available(iOS 14, tvOS 14, *)
func downloadFileWithStore(
  url: URL,
  to: FileSystemPath,
  options: DownloadOptions?,
  downloadUuid: String?,
  downloadStore: DownloadTaskStore,
  promise: Promise,
  sendEvent: @escaping (String, [String: Any]) -> Void
) throws {
  try to.validatePermission(.write)

  var request = URLRequest(url: url)

  if let headers = options?.headers {
    headers.forEach { key, value in
      request.addValue(value, forHTTPHeaderField: key)
    }
  }

  if let downloadUuid {
    let delegate = DownloadDelegate(
      uuid: downloadUuid,
      sourceUrl: url,
      destination: to,
      options: options,
      promise: promise,
      sendEvent: sendEvent,
      cleanup: {
        downloadStore.remove(uuid: downloadUuid)
      }
    )
    let session = URLSession(configuration: .default, delegate: delegate, delegateQueue: nil)
    let task = session.downloadTask(with: request)
    downloadStore.store(task: task, delegate: delegate, forUuid: downloadUuid)
    task.resume()
  } else {
    let downloadTask = URLSession.shared.downloadTask(with: request) { urlOrNil, responseOrNil, errorOrNil in
      guard errorOrNil == nil else {
        return promise.reject(UnableToDownloadException(errorOrNil?.localizedDescription ?? "unspecified error"))
      }
      guard let httpResponse = responseOrNil as? HTTPURLResponse else {
        return promise.reject(UnableToDownloadException("no response"))
      }
      guard httpResponse.statusCode >= 200 && httpResponse.statusCode < 300 else {
        return promise.reject(UnableToDownloadException("response has status \(httpResponse.statusCode)"))
      }
      guard let fileURL = urlOrNil else {
        return promise.reject(UnableToDownloadException("no file url"))
      }

      do {
        let destination: URL
        if let to = to as? FileSystemDirectory {
          let filename = httpResponse.suggestedFilename ?? url.lastPathComponent
          destination = to.url.appendingPathComponent(filename)
        } else {
          destination = to.url
        }
        if FileManager.default.fileExists(atPath: destination.path) {
          if options?.idempotent == true {
            try FileManager.default.removeItem(at: destination)
          } else {
            throw DestinationAlreadyExistsException()
          }
        }
        try FileManager.default.moveItem(at: fileURL, to: destination)
        promise.resolve(destination.absoluteString)
      } catch {
        promise.reject(error)
      }
    }
    downloadTask.resume()
  }
}

// MARK: - DownloadDelegate

/// URLSession delegate that reports download progress via the module event system
/// and resolves the JS promise on completion.
///
/// Progress events are throttled to at most one every 100 ms to avoid flooding the JS thread.
/// A final event is always sent when `totalBytesWritten == totalBytesExpectedToWrite`.
@available(iOS 14, tvOS 14, *)
class DownloadDelegate: NSObject, URLSessionDownloadDelegate {
  private let uuid: String
  private let sourceUrl: URL
  private let destination: FileSystemPath
  private let options: DownloadOptions?
  private let promise: Promise
  private let sendEvent: (String, [String: Any]) -> Void
  private let cleanup: () -> Void

  /// Minimum interval (in seconds) between progress events sent to JS.
  private let progressThrottleInterval: CFAbsoluteTime = 0.1
  private var lastProgressUpdate: CFAbsoluteTime = 0

  init(
    uuid: String,
    sourceUrl: URL,
    destination: FileSystemPath,
    options: DownloadOptions?,
    promise: Promise,
    sendEvent: @escaping (String, [String: Any]) -> Void,
    cleanup: @escaping () -> Void
  ) {
    self.uuid = uuid
    self.sourceUrl = sourceUrl
    self.destination = destination
    self.options = options
    self.promise = promise
    self.sendEvent = sendEvent
    self.cleanup = cleanup
  }

  // MARK: Progress

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  ) {
    let now = CFAbsoluteTimeGetCurrent()
    let timeSinceLastUpdate = now - lastProgressUpdate
    let isComplete = totalBytesWritten == totalBytesExpectedToWrite
    let shouldThrottle = timeSinceLastUpdate < progressThrottleInterval

    guard !shouldThrottle || isComplete else {
      return
    }

    lastProgressUpdate = now
    sendEvent("downloadProgress", [
      "uuid": uuid,
      "data": [
        "bytesWritten": totalBytesWritten,
        "totalBytes": totalBytesExpectedToWrite
      ]
    ])
  }

  // MARK: Completion

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didFinishDownloadingTo location: URL
  ) {
    defer {
      cleanup()
      session.finishTasksAndInvalidate()
    }

    guard let httpResponse = downloadTask.response as? HTTPURLResponse else {
      promise.reject(UnableToDownloadException("no response"))
      return
    }
    guard httpResponse.statusCode >= 200 && httpResponse.statusCode < 300 else {
      promise.reject(UnableToDownloadException("response has status \(httpResponse.statusCode)"))
      return
    }

    do {
      let dest: URL
      if let dir = destination as? FileSystemDirectory {
        let filename = httpResponse.suggestedFilename ?? sourceUrl.lastPathComponent
        dest = dir.url.appendingPathComponent(filename)
      } else {
        dest = destination.url
      }
      if FileManager.default.fileExists(atPath: dest.path) {
        if options?.idempotent == true {
          try FileManager.default.removeItem(at: dest)
        } else {
          throw DestinationAlreadyExistsException()
        }
      }
      try FileManager.default.moveItem(at: location, to: dest)
      promise.resolve(dest.absoluteString)
    } catch {
      promise.reject(error)
    }
  }

  // MARK: Error

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    defer {
      session.finishTasksAndInvalidate()
    }
    guard let error else {
      return
    }
    cleanup()
    if (error as NSError).code == NSURLErrorCancelled {
      promise.reject(DownloadCancelledException())
    } else {
      promise.reject(UnableToDownloadException(error.localizedDescription))
    }
  }
}
