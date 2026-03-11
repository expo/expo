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
 * Uses URLSessionDataTask with manual file writing so that pause/resume works via byte-offset
 * Range headers, independent of server-provided resume data.
 */
class FileSystemDownloadTask: SharedObject {
  private var session: URLSession?
  private var dataTask: URLSessionDataTask?
  private var delegate: DownloadTaskDelegate?
  var isPausing = false

  func start(url: URL, to: FileSystemPath, options: DownloadTaskOptions?, promise: Promise) {
    isPausing = false

    let destinationUrl = resolveDestinationUrl(to: to, url: url)

    // Remove existing file for a fresh start
    if FileManager.default.fileExists(atPath: destinationUrl.path) {
      try? FileManager.default.removeItem(at: destinationUrl)
    }

    // Create parent directories
    try? FileManager.default.createDirectory(
      at: destinationUrl.deletingLastPathComponent(),
      withIntermediateDirectories: true
    )
    FileManager.default.createFile(atPath: destinationUrl.path, contents: nil)

    delegate = DownloadTaskDelegate(sharedObject: self, destinationUrl: destinationUrl, offset: 0, promise: promise)

    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    configuration.urlCache = nil
    session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: .main)

    var request = URLRequest(url: url)
    if let headers = options?.headers {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }

    dataTask = session?.dataTask(with: request)
    dataTask?.resume()
  }

  func pause() -> [String: String?] {
    isPausing = true
    dataTask?.cancel()
    let bytesWritten = delegate?.totalBytesWritten ?? 0
    return ["resumeData": String(bytesWritten)]
  }

  func resume(url: URL, to: FileSystemPath, resumeData: String, options: DownloadTaskOptions?, promise: Promise) {
    isPausing = false

    // Invalidate the old session from the previous start/resume call
    session?.invalidateAndCancel()
    session = nil
    delegate = nil

    guard let offset = Int64(resumeData) else {
      promise.reject(InvalidResumeDataException())
      return
    }

    let destinationUrl = resolveDestinationUrl(to: to, url: url)

    delegate = DownloadTaskDelegate(sharedObject: self, destinationUrl: destinationUrl, offset: offset, promise: promise)

    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    configuration.urlCache = nil
    session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: .main)

    var request = URLRequest(url: url)
    request.setValue("bytes=\(offset)-", forHTTPHeaderField: "Range")
    if let headers = options?.headers {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }

    dataTask = session?.dataTask(with: request)
    dataTask?.resume()
  }

  func cancel() {
    isPausing = false
    dataTask?.cancel()
    cleanup()
  }

  override func sharedObjectWillRelease() {
    dataTask?.cancel()
    session?.invalidateAndCancel()
    cleanup()
  }

  private func cleanup() {
    delegate = nil
    dataTask = nil
    session?.invalidateAndCancel()
    session = nil
  }

  private func resolveDestinationUrl(to: FileSystemPath, url: URL) -> URL {
    if let directory = to as? FileSystemDirectory {
      let filename = url.lastPathComponent.isEmpty ? "download" : url.lastPathComponent
      return directory.url.appendingPathComponent(filename)
    }
    return to.url
  }
}

// MARK: - Download Task Delegate

class DownloadTaskDelegate: NSObject, URLSessionDataDelegate {
  private weak var sharedObject: FileSystemDownloadTask?
  private let destinationUrl: URL
  private let promise: Promise
  private var fileHandle: FileHandle?
  private(set) var totalBytesWritten: Int64
  private let offset: Int64
  private var expectedTotalBytes: Int64 = -1
  private var lastProgressTime: TimeInterval = 0
  private let progressThrottleInterval: TimeInterval = 0.1 // 100ms

  init(sharedObject: FileSystemDownloadTask, destinationUrl: URL, offset: Int64, promise: Promise) {
    self.sharedObject = sharedObject
    self.destinationUrl = destinationUrl
    self.offset = offset
    self.totalBytesWritten = offset
    self.promise = promise
    super.init()
  }

  // Response received — open file handle
  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    let httpResponse = response as? HTTPURLResponse

    // Validate HTTP status
    if let httpResponse,
       !(200...299).contains(httpResponse.statusCode) && httpResponse.statusCode != 206 {
      completionHandler(.cancel)
      promise.reject(UnableToDownloadException("server returned HTTP \(httpResponse.statusCode)"))
      return
    }

    let isPartial = httpResponse?.statusCode == 206

    if offset > 0 && isPartial {
      // Server supports Range — append to existing file
      fileHandle = try? FileHandle(forWritingTo: destinationUrl)
      fileHandle?.seekToEndOfFile()
    } else {
      // Fresh download or server ignored Range header (200 instead of 206) — truncate and restart
      totalBytesWritten = 0
      FileManager.default.createFile(atPath: destinationUrl.path, contents: nil)
      fileHandle = try? FileHandle(forWritingTo: destinationUrl)
    }

    let contentLength = response.expectedContentLength
    if isPartial {
      expectedTotalBytes = contentLength > 0 ? offset + contentLength : -1
    } else {
      expectedTotalBytes = contentLength > 0 ? contentLength : -1
    }

    completionHandler(.allow)
  }

  // Data chunk received — write to file and emit progress
  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    fileHandle?.write(data)
    totalBytesWritten += Int64(data.count)

    let currentTime = Date().timeIntervalSince1970
    if currentTime - lastProgressTime >= progressThrottleInterval {
      lastProgressTime = currentTime
      sharedObject?.emit(event: "progress", arguments: [
        "bytesWritten": totalBytesWritten,
        "totalBytes": expectedTotalBytes
      ])
    }
  }

  // Task completion with error handling
  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    fileHandle?.closeFile()
    fileHandle = nil

    if let error = error {
      let nsError = error as NSError
      if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
        if sharedObject?.isPausing == true {
          // Paused — resolve with nil
          promise.resolve(nil)
        } else {
          promise.reject(DownloadCancelledException())
        }
      } else {
        promise.reject(UnableToDownloadException(error.localizedDescription))
      }
    } else {
      // Emit final progress
      sharedObject?.emit(event: "progress", arguments: [
        "bytesWritten": totalBytesWritten,
        "totalBytes": totalBytesWritten
      ])
      promise.resolve(destinationUrl.absoluteString)
    }

    // Invalidate session to break retain cycle
    session.finishTasksAndInvalidate()
  }
}
