import ImageIO
import MobileCoreServices
import UIKit

extension UIImage {
  static func gif(data: Data) -> UIImage? {
    // Create an image source from the data
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
      return nil
    }
    // Get number of frames in the GIF
    let count = CGImageSourceGetCount(source)
    // If the gif has only one frame, create a UIImage from the first frame
    if count <= 1 {
      guard let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        return nil
      }
      return UIImage(cgImage: cgImage)
    }
    // Create an array of UIImages from the GIF frames
    var images = [UIImage]()
    var delay: Double = 0
    for index in 0 ..< count {
      // Read GIF frame metadata
      if let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [String: Any],
         // Index into property where delays are stored
         let gifProperties = properties[kCGImagePropertyGIFDictionary as String] as? [String: Any] {
          // Delay times >= 1 second
          let unclampedDelayTime = gifProperties[kCGImagePropertyGIFUnclampedDelayTime as String] as? Double
          // Delay times < 1 second
          let delayTime = gifProperties[kCGImagePropertyGIFDelayTime as String] as? Double
          // Setting default delay if both keys are not found
          delay = unclampedDelayTime ?? delayTime ?? delay
          if delay < 0.011 {
            delay = 0.100
        }
      }
      guard let cgImage = CGImageSourceCreateImageAtIndex(source, index, nil) else {
        return nil
      }
      let image = UIImage(cgImage: cgImage)
      images.append(image)
    }
    // Create the animated UIIMage from the array of UIImages
    return UIImage.animatedImage(with: images, duration: delay * Double(count))
  }

  func gifData(loopCount: Int = 0) -> Data? {
    // Get the images for the GIF
    let imagesToUse = images ?? [self]
    // Set the loop count for the GIF
    let gifLoopCount: [String: Any] = [kCGImagePropertyGIFLoopCount as String: loopCount]
    let gifProperties: [String: Any] = [kCGImagePropertyGIFDictionary as String: gifLoopCount]
    // Set the delay for each frame
    let defaultFrameDelay = 0.1
    let frameDelay = duration.isZero ? defaultFrameDelay : duration / Double(imagesToUse.count)
    let frameProperties: [String: Any] = [kCGImagePropertyGIFDictionary as String: [kCGImagePropertyGIFDelayTime as String: frameDelay]]
    // Create the GIF data
    let data = NSMutableData()
    if let destination = CGImageDestinationCreateWithData(data, kUTTypeGIF, imagesToUse.count, nil) {
      // Set GIF properties
      CGImageDestinationSetProperties(destination, gifProperties as CFDictionary)
        // Add each image to GIF
        for image in imagesToUse {
          guard let cgImage = image.cgImage else { continue }
            CGImageDestinationAddImage(destination, cgImage, frameProperties as CFDictionary)
        }
        // Finalize GIF
        if !CGImageDestinationFinalize(destination) {
          return nil
        }
    }
    return data as Data?
  }
}
