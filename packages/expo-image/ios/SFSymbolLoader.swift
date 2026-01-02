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

    // Get the symbol weight from URL query params (e.g., sf:/star?weight=bold)
    let weightParam = URLComponents(url: url, resolvingAgainstBaseURL: false)?
      .queryItems?
      .first(where: { $0.name == "weight" })?
      .value
    let weight = parseSymbolWeight(weightParam)

    // Use a large fixed point size for high quality, the image view will scale it down.
    // This ensures consistent sizing across different weights.
    let configuration = UIImage.SymbolConfiguration(pointSize: 100, weight: weight)

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

  // MARK: - Private

  private func parseSymbolWeight(_ fontWeight: String?) -> UIImage.SymbolWeight {
    guard let fontWeight = fontWeight else {
      return .regular
    }

    // Handle numeric font weights (CSS standard)
    switch fontWeight {
    case "100":
      return .ultraLight
    case "200":
      return .thin
    case "300":
      return .light
    case "400", "normal":
      return .regular
    case "500":
      return .medium
    case "600":
      return .semibold
    case "700", "bold":
      return .bold
    case "800":
      return .heavy
    case "900":
      return .black
    default:
      return .regular
    }
  }
}
