// Copyright 2026-present 650 Industries. All rights reserved.

@preconcurrency internal import SDWebImage
import ExpoModulesCore

/**
 Loads http(s) images with `SDWebImageDownloader`, reporting each download to React Native's core
 network reporter so it shows in the React Native DevTools Network panel.
 */
final class NetworkReportingImageLoader: NSObject, SDImageLoader {
  typealias ImageLoaderCompletedBlock = @Sendable (UIImage?, Data?, (any Error)?, Bool) -> Void

  private let downloader: SDWebImageDownloader

  init(downloader: SDWebImageDownloader) {
    self.downloader = downloader
  }

  // MARK: - SDImageLoader

  func canRequestImage(for url: URL?) -> Bool {
    guard url?.scheme == "http" || url?.scheme == "https" else {
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
    let source = context?[ImageView.contextSourceKey] as? ImageSource
    let reporter = ExpoNetworkReporter(devToolsRequestId: source?.devToolsRequestId)
    var context = context ?? [:]

    // Called once the download is created, but not when it's shared with an in-flight download of the
    // same URL, which is then left unreported here.
    let requestModifier = context[.downloadRequestModifier] as? SDWebImageDownloaderRequestModifierProtocol
    context[.downloadRequestModifier] = SDWebImageDownloaderRequestModifier { request in
      let modifiedRequest = requestModifier.map { $0.modifiedRequest(with: request) } ?? request
      guard let modifiedRequest,
        let mutableRequest = (modifiedRequest as NSURLRequest).mutableCopy() as? NSMutableURLRequest else {
        return nil
      }
      reporter.mark(mutableRequest)
      reporter.willSendRequest(mutableRequest as URLRequest)
      return mutableRequest as URLRequest
    }

    let responseModifier = context[.downloadResponseModifier] as? SDWebImageDownloaderResponseModifierProtocol
    context[.downloadResponseModifier] = SDWebImageDownloaderResponseModifier { response in
      let modifiedResponse = responseModifier.map { $0.modifiedResponse(with: response) } ?? response
      if let modifiedResponse {
        reporter.didReceiveResponse(modifiedResponse)
      }
      return modifiedResponse
    }

    return downloader.requestImage(with: url, options: options, context: context, progress: progressBlock) { image, data, error, finished in
      if let error {
        reporter.didFailLoading(cancelled: (error as NSError).code == SDWebImageError.cancelled.rawValue)
      } else if finished {
        if let data {
          reporter.didReceiveData(data)
        }
        reporter.didFinishLoading(encodedDataLength: data?.count ?? 0)
      }
      completedBlock?(image, data, error, finished)
    }
  }

  func shouldBlockFailedURL(with url: URL, error: Error) -> Bool {
    return downloader.shouldBlockFailedURL(with: url, error: error, options: [], context: nil)
  }
}
