import SDWebImage
import ExpoModulesCore

class BlurhashLoader: NSObject, SDImageLoader {
  // MARK: - SDImageLoader

  func canRequestImage(for url: URL?) -> Bool {
    return url?.scheme == "blurhash"
  }

  func requestImage(
    with url: URL?,
    options: SDWebImageOptions = [],
    context: [SDWebImageContextOption: Any]?,
    progress progressBlock: SDImageLoaderProgressBlock?,
    completed completedBlock: SDImageLoaderCompletedBlock? = nil
  ) -> SDWebImageOperation? {
    guard let url = url else {
      let error = error(description: "URL provided to BlurhashLoader is missing")
      completedBlock?(nil, nil, error, false)
      return nil
    }
    // The URI looks like this: blurhash:/WgF}G?az0fs.x[jat7xFRjNHt6s.4;oe-:RkVtkCi^Nbo|xZRjWB/16/16
    // Which means that the `pathComponents[0]` is `/` and we can skip that.
    let blurhash = url.pathComponents[1]
    let width = Int(url.pathComponents[2]) ?? 16
    let height = Int(url.pathComponents[3]) ?? 16
    let size = CGSize(width: width, height: height)

    DispatchQueue.global(qos: .userInitiated).async {
      if let image = image(fromBlurhash: blurhash, size: size) {
        DispatchQueue.main.async {
          completedBlock?(UIImage(cgImage: image), nil, nil, true)
        }
      } else {
        let error = error(description: "Unable to generate an image from the given blurhash")
        completedBlock?(nil, nil, error, false)
      }
    }
    return nil
  }

  func shouldBlockFailedURL(with url: URL, error: Error) -> Bool {
    // If the algorithm failed to generate an image from the url,
    // it's not possible that next time it will work :)
    return true
  }
}

private func error(description: String) -> NSError {
  let userInfo = [NSLocalizedDescriptionKey: description]
  return NSError(domain: "expo.modules.image", code: 0, userInfo: userInfo)
}
