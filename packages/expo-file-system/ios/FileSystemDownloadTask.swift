// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

enum NetworkTaskSessionType: String, Enumerable {
  case background
  case foreground
}

protocol NetworkTaskDelegate: AnyObject {
  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didSendBodyData bytesSent: Int64,
    totalBytesSent: Int64,
    totalBytesExpectedToSend: Int64
  )

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data)

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  )

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didFinishDownloadingTo location: URL
  )

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?)
}

extension NetworkTaskDelegate {
  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didSendBodyData bytesSent: Int64,
    totalBytesSent: Int64,
    totalBytesExpectedToSend: Int64
  ) {}

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {}

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  ) {}

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didFinishDownloadingTo location: URL
  ) {}
}

final class NetworkTaskSessionDispatcher: NSObject, URLSessionDataDelegate, URLSessionDownloadDelegate {
  static let shared = NetworkTaskSessionDispatcher()

  private var delegates: [String: NetworkTaskDelegate] = [:]
  private let lock = NSLock()
  private lazy var sessionHandler = ExpoAppDelegateSubscriberRepository.getSubscriberOfType(
    FileSystemBackgroundSessionHandler.self
  )

  func register(
    delegate: NetworkTaskDelegate,
    for task: URLSessionTask,
    in session: URLSession
  ) -> String {
    let key = makeKey(session: session, task: task)
    lock.lock()
    delegates[key] = delegate
    lock.unlock()
    return key
  }

  func unregister(key: String?) {
    guard let key else {
      return
    }
    lock.lock()
    delegates.removeValue(forKey: key)
    lock.unlock()
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didSendBodyData bytesSent: Int64,
    totalBytesSent: Int64,
    totalBytesExpectedToSend: Int64
  ) {
    delegate(for: session, task: task)?.urlSession(
      session,
      task: task,
      didSendBodyData: bytesSent,
      totalBytesSent: totalBytesSent,
      totalBytesExpectedToSend: totalBytesExpectedToSend
    )
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    delegate(for: session, task: dataTask)?.urlSession(session, dataTask: dataTask, didReceive: data)
  }

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  ) {
    delegate(for: session, task: downloadTask)?.urlSession(
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
    delegate(for: session, task: downloadTask)?.urlSession(
      session,
      downloadTask: downloadTask,
      didFinishDownloadingTo: location
    )
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    let key = makeKey(session: session, task: task)
    delegate(for: session, task: task)?.urlSession(session, task: task, didCompleteWithError: error)
    unregister(key: key)
  }

  func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
    guard let identifier = session.configuration.identifier else {
      return
    }
    sessionHandler?.invokeCompletionHandler(forSessionIdentifier: identifier)
  }

  private func delegate(for session: URLSession, task: URLSessionTask) -> NetworkTaskDelegate? {
    lock.lock()
    defer {
      lock.unlock()
    }
    return delegates[makeKey(session: session, task: task)]
  }

  private func makeKey(session: URLSession, task: URLSessionTask) -> String {
    let sessionIdentifier = session.configuration.identifier ?? "foreground"
    return "\(sessionIdentifier):\(task.taskIdentifier)"
  }
}

final class NetworkTaskSessionManager {
  static let shared = NetworkTaskSessionManager()

  private let dispatcher = NetworkTaskSessionDispatcher.shared

  private lazy var foregroundSession = createForegroundSession()

  #if os(iOS)
  private lazy var backgroundSession = createBackgroundSession()
  #endif

  func session(for type: NetworkTaskSessionType) -> URLSession {
    switch type {
    case .foreground:
      return foregroundSession
    case .background:
      #if os(iOS)
      return backgroundSession
      #else
      return foregroundSession
      #endif
    }
  }

  func register(
    delegate: NetworkTaskDelegate,
    for task: URLSessionTask,
    in session: URLSession
  ) -> String {
    return dispatcher.register(delegate: delegate, for: task, in: session)
  }

  func unregister(key: String?) {
    dispatcher.unregister(key: key)
  }

  private func createForegroundSession() -> URLSession {
    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    configuration.urlCache = nil
    return URLSession(configuration: configuration, delegate: dispatcher, delegateQueue: .main)
  }

  #if os(iOS)
  private func createBackgroundSession() -> URLSession {
    let configuration = URLSessionConfiguration.background(
      withIdentifier: Self.backgroundSessionIdentifier
    )
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    configuration.urlCache = nil
    configuration.sessionSendsLaunchEvents = true
    configuration.isDiscretionary = false
    return URLSession(configuration: configuration, delegate: dispatcher, delegateQueue: .main)
  }

  private static let backgroundSessionIdentifier = {
    let bundleIdentifier = Bundle.main.bundleIdentifier ?? "expo.modules.filesystem"
    return "\(bundleIdentifier).expo-file-system.network-task.background"
  }()
  #endif
}

/**
 * A record type for download task options.
 */
struct DownloadTaskOptions: Record {
  @Field var headers: [String: String]?
  @Field var sessionType: NetworkTaskSessionType = .background
}

/**
 * A SharedObject that handles file downloads with pause/resume support and progress tracking.
 */
class FileSystemDownloadTask: SharedObject {
  private var downloadTask: URLSessionDownloadTask?
  private var delegateKey: String?
  private var sessionType: NetworkTaskSessionType = .background
  private(set) var isPausing = false

  func start(url: URL, to: FileSystemPath, options: DownloadTaskOptions?, promise: Promise) {
    isPausing = false
    sessionType = options?.sessionType ?? .background

    let session = NetworkTaskSessionManager.shared.session(for: sessionType)
    let delegate = DownloadTaskDelegate(sharedObject: self, destination: to, promise: promise)

    var request = URLRequest(url: url)
    if let headers = options?.headers {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }

    let task = session.downloadTask(with: request)
    downloadTask = task
    delegateKey = NetworkTaskSessionManager.shared.register(delegate: delegate, for: task, in: session)
    task.resume()
  }

  func pause() async -> [String: String?] {
    isPausing = true
    guard let downloadTask else {
      return ["resumeData": nil]
    }

    let resumeData = await downloadTask.cancelByProducingResumeData()
    return ["resumeData": resumeData?.base64EncodedString()]
  }

  func resume(
    url: URL,
    to: FileSystemPath,
    resumeData: String,
    options: DownloadTaskOptions?,
    promise: Promise
  ) {
    isPausing = false
    sessionType = options?.sessionType ?? sessionType

    guard let data = Data(base64Encoded: resumeData) else {
      promise.reject(InvalidResumeDataException())
      return
    }

    let session = NetworkTaskSessionManager.shared.session(for: sessionType)
    let delegate = DownloadTaskDelegate(sharedObject: self, destination: to, promise: promise)
    let task = session.downloadTask(withResumeData: data)

    downloadTask = task
    delegateKey = NetworkTaskSessionManager.shared.register(delegate: delegate, for: task, in: session)
    task.resume()
  }

  func cancel() {
    isPausing = false
    downloadTask?.cancel()
    cleanup(unregisterDelegate: false)
  }

  func finishTask() {
    // Delegate is unregistered by NetworkTaskSessionDispatcher after didCompleteWithError returns.
    cleanup(unregisterDelegate: false)
  }

  override func sharedObjectWillRelease() {
    downloadTask?.cancel()
    cleanup(unregisterDelegate: false)
  }

  private func cleanup(unregisterDelegate: Bool) {
    if unregisterDelegate {
      NetworkTaskSessionManager.shared.unregister(key: delegateKey)
    }
    delegateKey = nil
    downloadTask = nil
  }
}

// MARK: - Download Task Delegate

private final class DownloadTaskDelegate: NSObject, NetworkTaskDelegate {
  private weak var sharedObject: FileSystemDownloadTask?
  private let destination: FileSystemPath
  private let promise: Promise
  private var lastProgressTime: TimeInterval = 0
  private let progressThrottleInterval: TimeInterval = 0.1

  init(sharedObject: FileSystemDownloadTask, destination: FileSystemPath, promise: Promise) {
    self.sharedObject = sharedObject
    self.destination = destination
    self.promise = promise
    super.init()
  }

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  ) {
    let currentTime = Date().timeIntervalSince1970
    let shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval ||
      totalBytesWritten == totalBytesExpectedToWrite

    if shouldEmit {
      lastProgressTime = currentTime
      sharedObject?.emit(event: "progress", arguments: [
        "bytesWritten": totalBytesWritten,
        "totalBytes": totalBytesExpectedToWrite,
      ])
    }
  }

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didFinishDownloadingTo location: URL
  ) {
    do {
      if let httpResponse = downloadTask.response as? HTTPURLResponse,
         !(200...299).contains(httpResponse.statusCode) {
        promise.reject(UnableToDownloadException("server returned HTTP \(httpResponse.statusCode)"))
        return
      }

      let resolvedUrl = try destination.withCorrectTypeAndScopedAccess(permission: .write) {
        let destinationUrl: URL
        if let directory = destination as? FileSystemDirectory {
          let httpResponse = downloadTask.response as? HTTPURLResponse
          let filename = httpResponse?.suggestedFilename ??
            downloadTask.originalRequest?.url?.lastPathComponent ??
            "download"
          destinationUrl = directory.url.appendingPathComponent(filename)
        } else {
          destinationUrl = destination.url
        }

        if FileManager.default.fileExists(atPath: destinationUrl.path) {
          try FileManager.default.removeItem(at: destinationUrl)
        }

        try FileManager.default.createDirectory(
          at: destinationUrl.deletingLastPathComponent(),
          withIntermediateDirectories: true
        )
        try FileManager.default.moveItem(at: location, to: destinationUrl)
        return destinationUrl.absoluteString
      }
      promise.resolve(resolvedUrl)
    } catch {
      promise.reject(
        UnableToDownloadException("Failed to move downloaded file: \(error.localizedDescription)")
      )
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    defer {
      sharedObject?.finishTask()
    }

    guard let error else {
      return
    }

    let nsError = error as NSError
    if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
      if sharedObject?.isPausing == true {
        promise.resolve(nil)
      } else {
        promise.reject(DownloadCancelledException())
      }
      return
    }

    promise.reject(UnableToDownloadException(error.localizedDescription))
  }
}
