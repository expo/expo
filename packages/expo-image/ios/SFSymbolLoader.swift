// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

class SFSymbolLoader: NSObject, SDImageLoader {
  // MARK: - SDImageLoader

  func canRequestImage(for url: URL?) -> Bool {
    return url?.scheme == "sf"
  }

  func requestImage(
    with url: URL?,
    options: SDWebImageOptions = [],
    context: [SDWebImageContextOption: Any]?,
    progress progressBlock: SDImageLoaderProgressBlock?,
    completed completedBlock: SDImageLoaderCompletedBlock? = nil
  ) -> SDWebImageOperation? {
    guard let url = url else {
      let error = makeNSError(description: "URL provided to SFSymbolLoader is missing")
      completedBlock?(nil, nil, error, false)
      return nil
    }

    // The URI looks like this: sf:/star.fill
    // pathComponents[0] is `/`, pathComponents[1] is the symbol name
    guard url.pathComponents.count > 1 else {
      let error = makeNSError(description: "SF Symbol name is missing from the URL")
      completedBlock?(nil, nil, error, false)
      return nil
    }

    let symbolName = url.pathComponents[1]

    // Get the frame size from context for proper sizing
    let frameSize = context?[ImageView.frameSizeKey] as? CGSize ?? CGSize(width: 24, height: 24)
    let screenScale = context?[ImageView.screenScaleKey] as? Double ?? UIScreen.main.scale

    // Calculate point size based on the smaller dimension to ensure the symbol fits
    let pointSize = min(frameSize.width, frameSize.height) * screenScale

    // Create symbol configuration with appropriate size
    let configuration = UIImage.SymbolConfiguration(pointSize: pointSize, weight: .regular)

    guard let image = UIImage(systemName: symbolName, withConfiguration: configuration) else {
      let error = makeNSError(description: "Unable to create SF Symbol image for '\(symbolName)'")
      completedBlock?(nil, nil, error, false)
      return nil
    }

    // Return as template image so tintColor prop works correctly
    let templateImage = image.withRenderingMode(.alwaysTemplate)
    completedBlock?(templateImage, nil, nil, true)
    return nil
  }

  func shouldBlockFailedURL(with url: URL, error: Error) -> Bool {
    // If the symbol doesn't exist, it won't exist on subsequent attempts
    return true
  }
}
