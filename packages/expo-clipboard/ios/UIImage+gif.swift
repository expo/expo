import ImageIO
import MobileCoreServices
import UIKit

extension UIImage {
  static func gif(data: Data) -> UIImage? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
      return nil
    }
    var images = [UIImage]()
    var totalDuration: TimeInterval = 0.0
    let count = CGImageSourceGetCount(source)
    for i in 0 ..< count {
      if let cgImage = CGImageSourceCreateImageAtIndex(source, i, nil) {
        let image = UIImage(cgImage: cgImage)
        images.append(image)
        let delaySeconds = UIImage.delayForImageAtIndex(index: i, source: source)
        totalDuration += delaySeconds
      }
    }
    return UIImage.animatedImage(with: images, duration: totalDuration)
  }
  static func delayForImageAtIndex(index: Int, source: CGImageSource) -> TimeInterval {
    var delay = 0.1
    if let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as Dictionary?,
      let gifProperties = properties[kCGImagePropertyGIFDictionary as String] as? [String: Any] {
      let unclampedDelayTime = gifProperties[kCGImagePropertyGIFUnclampedDelayTime as String] as? Double
      let delayTime = gifProperties[kCGImagePropertyGIFDelayTime as String] as? Double
      delay = unclampedDelayTime ?? delayTime ?? delay
      if delay < 0.011 {
        delay = 0.100 // Make sure they're not too fast
      }
    }
    return delay
  }
  var isAnimated: Bool {
    return images != nil
  }
  func gifData(loopCount: Int = 0) -> Data? {
    let imagesToUse = images ?? [self]
    let gifLoopCount: [String: Any] = [kCGImagePropertyGIFLoopCount as String: loopCount]
    let gifProperties: [String: Any] = [kCGImagePropertyGIFDictionary as String: gifLoopCount]
    let defaultFrameDelay = 0.1
    let frameDelay = duration.isZero ? defaultFrameDelay : duration / Double(imagesToUse.count)
    let frameProperties: [String: Any] = [kCGImagePropertyGIFDictionary as String: [kCGImagePropertyGIFDelayTime as String: frameDelay]]
    let data = NSMutableData()
    if let destination = CGImageDestinationCreateWithData(data, kUTTypeGIF, imagesToUse.count, nil) {
      CGImageDestinationSetProperties(destination, gifProperties as CFDictionary)
        for image in imagesToUse {
          guard let cgImage = image.cgImage else { continue }
            CGImageDestinationAddImage(destination, cgImage, frameProperties as CFDictionary)
        }
        if !CGImageDestinationFinalize(destination) {
            return nil
        }
    }
    return data as Data
  }
}
