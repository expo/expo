import UIKit
import MediaPlayer
import Foundation

// If we ever want to use this class for something else we should probably make these configurable through the constructor
// I couldn't find any information on recommended artwork resolution, but this seems like a reasonable value considering how it's displayed ~@behenate
private let maxImageSize = CGSize(width: 1024, height: 1024)
private let cacheCompressionQuality: CGFloat = 0.8
private let cacheCountLimit = 20

public class NowPlayingArtworkCache {
  private let cachedImages = NSCache<NSURL, NSData>()
  private var loadingResponses = [NSURL: [(String, MPMediaItemArtwork?) -> Swift.Void]]()

  init() {
    cachedImages.countLimit = cacheCountLimit
  }

  private func image(url: NSURL) -> MPMediaItemArtwork? {
    if let imageData = cachedImages.object(forKey: url) as? Data, let image = UIImage(data: imageData) {
      return MPMediaItemArtwork(image: image)
    }
    return nil
  }

  func load(url: NSURL, item: String, completion: @escaping (String, MPMediaItemArtwork?) -> Swift.Void) {
    if let cachedImage = image(url: url) {
      DispatchQueue.main.async {
        completion(item, cachedImage)
      }
      return
    }

    if loadingResponses[url] != nil {
      loadingResponses[url]?.append(completion)
      return
    }
    loadingResponses[url] = [completion]

    let dataTask = URLSession.shared.dataTask(with: url as URL) { [weak self] data, _, error in
      guard let responseData = data, let image = UIImage(data: responseData), let blocks = self?.loadingResponses[url], error == nil else {
        DispatchQueue.main.async {
          completion(item, nil)
        }
        return
      }

      let imageAspectRatio = image.size.height / image.size.width
      let resizedImage = image.resizedToFit(size: maxImageSize)
      let artwork = MPMediaItemArtwork(image: resizedImage)

      // Cache the resized image as jpeg to save some memory
      if let cacheData = resizedImage.jpegData(compressionQuality: cacheCompressionQuality) as? NSData {
        self?.cachedImages.setObject(cacheData, forKey: url, cost: responseData.count)
      }

      for block in blocks {
        DispatchQueue.main.async {
          block(item, artwork)
        }
        return
      }
    }
    dataTask.resume()
  }
}

private extension UIImage {
  func resizedToFit(size: CGSize) -> UIImage {
    let aspectRatio = self.size.width / self.size.height
    let targetAspectRatio = size.width / size.height

    var newSize = size

    if aspectRatio > targetAspectRatio {
      // Image is wider than the target size
      newSize.width = size.width
      newSize.height = size.width / aspectRatio
    } else {
      // Image is taller than the target size
      newSize.height = size.height
      newSize.width = size.height * aspectRatio
    }

    let renderer = UIGraphicsImageRenderer(size: newSize)
    return renderer.image { _ in
      self.draw(in: CGRect(origin: .zero, size: newSize))
    }
  }
}
