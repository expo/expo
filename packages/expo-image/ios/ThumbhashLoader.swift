import SDWebImage
import ExpoModulesCore

class ThumbhashLoader: NSObject, SDImageLoader {
  // MARK: - SDImageLoader

  func canRequestImage(for url: URL?) -> Bool {
    return url?.scheme == "thumbhash"
  }

  func requestImage(
    with url: URL?,
    options: SDWebImageOptions = [],
    context: [SDWebImageContextOption: Any]?,
    progress progressBlock: SDImageLoaderProgressBlock?,
    completed completedBlock: SDImageLoaderCompletedBlock? = nil
  ) -> SDWebImageOperation? {
    guard let url = url else {
      let error = makeNSError(description: "URL provided to ThumbhashLoader is missing")
      completedBlock?(nil, nil, error, false)
      return nil
    }

    // The URI looks like this: thumbhash:/3OcRJYB4d3h/iIeHeEh3eIhw+j2w
    // the "thumbhash:/" part has to be skipped, but the hash can contain other '/' characters, which need to be included
    let thumbhash = url.pathComponents[1..<url.pathComponents.count].joined(separator: "/")
    guard let thumbhashData = Data(base64Encoded: thumbhash, options: .ignoreUnknownCharacters) else {
      let error = makeNSError(description: "URL provided to ThumbhashLoader is invalid")
      completedBlock?(nil, nil, error, false)
      return nil
    }

    DispatchQueue.global(qos: .userInitiated).async {
      let image = image(fromThumbhash: thumbhashData)
      DispatchQueue.main.async {
        completedBlock?(image, nil, nil, true)
      }
    }
    return nil
  }

  func shouldBlockFailedURL(with url: URL, error: Error) -> Bool {
    return true
  }
}
