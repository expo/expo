// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// Manages active download tasks and their delegates, and acts as the shared URLSession delegate
/// that multiplexes callbacks to per-task `DownloadDelegate` instances.
///
/// All access to the internal dictionaries is serialized through a serial dispatch queue
/// so that concurrent calls from URLSession delegate callbacks and the main thread are safe.
@available(iOS 14, tvOS 14, *)
class DownloadTaskStore: NSObject, URLSessionDownloadDelegate {
  private let queue = DispatchQueue(label: "expo.modules.filesystem.DownloadTaskStore")
  private var tasks: [String: URLSessionDownloadTask] = [:]
  private var delegatesByTaskId: [Int: DownloadDelegate] = [:]

  lazy var session: URLSession = URLSession(configuration: .default, delegate: self, delegateQueue: nil)

  func store(task: URLSessionDownloadTask, delegate: DownloadDelegate, forUuid uuid: String) {
    queue.sync {
      tasks[uuid] = task
      delegatesByTaskId[task.taskIdentifier] = delegate
    }
  }

  func cancel(uuid: String) {
    queue.sync {
      tasks[uuid]?.cancel()
    }
  }

  func remove(uuid: String) {
    queue.sync {
      if let task = tasks.removeValue(forKey: uuid) {
        delegatesByTaskId.removeValue(forKey: task.taskIdentifier)
      }
    }
  }

  private func delegate(for task: URLSessionTask) -> DownloadDelegate? {
    queue.sync {
      delegatesByTaskId[task.taskIdentifier]
    }
  }

  // MARK: - URLSessionDownloadDelegate

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  ) {
    delegate(for: downloadTask)?.urlSession(
      session,
      downloadTask: downloadTask,
      didWriteData: bytesWritten,
      totalBytesWritten: totalBytesWritten,
      totalBytesExpectedToWrite: totalBytesExpectedToWrite
    )
  }

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didFinishDownloadingTo location: URL
  ) {
    delegate(for: downloadTask)?.urlSession(session, downloadTask: downloadTask, didFinishDownloadingTo: location)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    delegate(for: task)?.urlSession(session, task: task, didCompleteWithError: error)
  }
}

// MARK: - downloadFileWithStore

/// Executes a file download with optional progress reporting and cancellation.
///
/// When `downloadUuid` is non-nil, uses a shared delegate-based `URLSession` that reports progress
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
    let task = downloadStore.session.downloadTask(with: request)
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
