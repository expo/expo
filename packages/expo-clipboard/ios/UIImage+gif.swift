import ImageIO
import MobileCoreServices
import UIKit

extension UIImage {
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
    return data as Data?
  }
}
