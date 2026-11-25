// Copyright 2026-present 650 Industries. All rights reserved.

@preconcurrency internal import SDWebImage
import ExpoModulesCore

/**
 Loads http(s) images with `SDWebImageDownloader`, reporting each download to React Native's core
 network reporter so it shows in the React Native DevTools Network panel.
 */
final class NetworkReportingImageLoader: NSObject, SDImageLoader {
  typealias ImageLoaderCompletedBlock = @Sendable (UIImage?, Data?, (any Error)?, Bool) -> Void

  /// The report for one download, shared by every load attached to it. `SDWebImageDownloader` attaches
  /// a load of a URL that is already downloading to that download instead of starting another.
  private final class DownloadReport: @unchecked Sendable {
    let requestId: String
    var attachedLoads = 1
    var receivedResponse = false

    init(devToolsRequestId: String?) {
      requestId = ExpoNetworkReporter.makeRequestId(devToolsRequestId: devToolsRequestId)
    }
  }

  /// One `requestImage` call, and the download report it is attached to.
  private final class Load: @unchecked Sendable {
    var report: DownloadReport?
    var completed = false
  }

  private enum Outcome {
    case unreported
    case finished
    case failed(cancelled: Bool)
  }

  private let downloader: SDWebImageDownloader
  /// In-flight download reports by URL, the key `SDWebImageDownloader` shares downloads by.
  private let reports = Mutex([URL: DownloadReport]())

  init(downloader: SDWebImageDownloader) {
    self.downloader = downloader
  }

  // MARK: - SDImageLoader

  func canRequestImage(for url: URL?) -> Bool {
    guard let scheme = url?.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
      return false
    }
    return downloader.canRequestImage(for: url, options: [], context: nil)
  }

  func requestImage(
    with url: URL?,
    options: SDWebImageOptions = [],
    context: [SDWebImageContextOption: Any]?,
    progress progressBlock: SDImageLoaderProgressBlock?,
    completed completedBlock: ImageLoaderCompletedBlock? = nil
  ) -> SDWebImageOperation? {
    guard let url else {
      return downloader.requestImage(with: url, options: options, context: context, progress: progressBlock, completed: completedBlock)
    }
    let source = context?[ImageView.contextSourceKey] as? ImageSource
    let report = DownloadReport(devToolsRequestId: source?.devToolsRequestId)
    let load = Load()
    var context = context ?? [:]

    // Runs only when this load starts a new download. SDWebImage calls it when it creates the download
    // operation, before the operation waits in the download queue, so the reported start includes that wait.
    let requestModifier = context[.downloadRequestModifier] as? SDWebImageDownloaderRequestModifierProtocol ?? downloader.requestModifier
    context[.downloadRequestModifier] = SDWebImageDownloaderRequestModifier { [reports] request in
      let modifiedRequest = requestModifier.map { $0.modifiedRequest(with: request) } ?? request
      guard let modifiedRequest,
        let mutableRequest = (modifiedRequest as NSURLRequest).mutableCopy() as? NSMutableURLRequest else {
        return nil
      }
      reports.withLock { reports in
        reports[url] = report
        load.report = report
      }
      ExpoNetworkReporter.mark(mutableRequest, requestId: report.requestId)
      ExpoNetworkReporter.shared.willSendRequest(report.requestId, request: mutableRequest as URLRequest)
      return mutableRequest as URLRequest
    }

    let responseModifier = context[.downloadResponseModifier] as? SDWebImageDownloaderResponseModifierProtocol ?? downloader.responseModifier
    context[.downloadResponseModifier] = SDWebImageDownloaderResponseModifier { [reports] response in
      let modifiedResponse = responseModifier.map { $0.modifiedResponse(with: response) } ?? response
      if let modifiedResponse {
        reports.withLock { _ in
          report.receivedResponse = true
        }
        ExpoNetworkReporter.shared.didReceiveResponse(report.requestId, response: modifiedResponse)
      }
      return modifiedResponse
    }

    let operation = downloader.requestImage(with: url, options: options, context: context, progress: progressBlock) { [reports] image, data, error, finished in
      guard finished else {
        completedBlock?(image, data, error, finished)
        return
      }
      let (requestId, outcome) = reports.withLock { reports in
        load.completed = true
        guard let report = load.report else {
          return (nil as String?, Outcome.unreported)
        }
        load.report = nil
        return (report.requestId, Self.complete(report, for: url, error: error, in: &reports))
      }
      if let requestId {
        switch outcome {
        case .unreported:
          break
        case .finished:
          if let data {
            ExpoNetworkReporter.shared.didReceiveData(requestId, data: data)
          }
          ExpoNetworkReporter.shared.didFinishLoading(requestId, encodedDataLength: data?.count ?? 0)
        case .failed(let cancelled):
          ExpoNetworkReporter.shared.didFailLoading(requestId, cancelled: cancelled)
        }
      }
      completedBlock?(image, data, error, finished)
    }

    // A load that joined an in-flight download shares that download's report.
    reports.withLock { reports in
      guard load.report == nil, !load.completed, let shared = reports[url] else {
        return
      }
      shared.attachedLoads += 1
      load.report = shared
    }
    return operation
  }

  func shouldBlockFailedURL(with url: URL, error: Error) -> Bool {
    return downloader.shouldBlockFailedURL(with: url, error: error, options: [], context: nil)
  }

  // MARK: - Private

  /// Detaches one load from its download report. A cancelled load leaves the download running while
  /// other loads are still attached, so only the last one reports the cancellation. An HTTP status or
  /// decoding error arrives after a full response, so it finishes the request rather than failing it.
  private static func complete(
    _ report: DownloadReport,
    for url: URL,
    error: (any Error)?,
    in reports: inout [URL: DownloadReport]
  ) -> Outcome {
    let nsError = error.map { $0 as NSError }
    let isSDWebImageError = nsError?.domain == SDWebImageErrorDomain
    if isSDWebImageError && nsError?.code == SDWebImageError.cancelled.rawValue {
      report.attachedLoads -= 1
      guard report.attachedLoads == 0 else {
        return .unreported
      }
      removeReport(report, for: url, in: &reports)
      return .failed(cancelled: true)
    }
    removeReport(report, for: url, in: &reports)
    if nsError == nil || (isSDWebImageError && report.receivedResponse) {
      return .finished
    }
    return .failed(cancelled: false)
  }

  private static func removeReport(_ report: DownloadReport, for url: URL, in reports: inout [URL: DownloadReport]) {
    if reports[url] === report {
      reports[url] = nil
    }
  }
}
