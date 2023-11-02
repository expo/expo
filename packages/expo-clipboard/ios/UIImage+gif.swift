import UIKit
import ImageIO
import MobileCoreServices

extension UIImage {
    static func gif(data: Data) -> UIImage? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
            return nil
        }

        var images = [UIImage]()
        var totalDuration: TimeInterval = 0.0

        let count = CGImageSourceGetCount(source)
        for i in 0..<count {
            if let cgImage = CGImageSourceCreateImageAtIndex(source, i, nil) {
                let image = UIImage(cgImage: cgImage)
                images.append(image)

                let delaySeconds = UIImage.delayForImageAtIndex(index: Int(i), source: source)
                totalDuration += delaySeconds
            }
        }

        return UIImage.animatedImage(with: images, duration: totalDuration)
    }

    static func delayForImageAtIndex(index: Int, source: CGImageSource) -> TimeInterval {
        var delay = 0.1

        let cfProperties = CGImageSourceCopyPropertiesAtIndex(source, index, nil)
        let gifProperties: CFDictionary? = CFDictionaryGetValue(cfProperties, Unmanaged.passUnretained(kCGImagePropertyGIFDictionary).toOpaque())?.assumingMemoryBound(to: CFDictionary.self).pointee

        if let gifProperties = gifProperties {
            var delayTime: Double = 0
            if let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [String: Any],
               let gifProperties = properties[kCGImagePropertyGIFDictionary as String] as? [String: Any] {
                if let delayTimeUnclampedProp = gifProperties[kCGImagePropertyGIFUnclampedDelayTime as String] as? NSNumber {
                    delayTime = delayTimeUnclampedProp.doubleValue
                } else if let delayTimeProp = gifProperties[kCGImagePropertyGIFDelayTime as String] as? NSNumber {
                    delayTime = delayTimeProp.doubleValue
                }
            }

            if let delayTime = delayTime as? NSNumber {
                delay = delayTime.doubleValue

                if delay < 0.011 {
                    delay = 0.100 // Make sure they're not too fast
                }
            }
        }

        return delay
    }
    var isAnimated: Bool {
        return images != nil
    }

    func gifData(loopCount: Int = 0) -> Data? {
        let imagesToUse = self.images ?? [self]
        let gifLoopCount = [kCGImagePropertyGIFLoopCount as String: loopCount]
        let gifProperties = [kCGImagePropertyGIFDictionary as String: gifLoopCount]

        // Assuming a default frame delay for single frame if not animated.
        let defaultFrameDelay = 0.1
        let frameDelay = self.duration.isZero ? defaultFrameDelay : self.duration / Double(imagesToUse.count)
        let frameProperties = [kCGImagePropertyGIFDictionary as String: [kCGImagePropertyGIFDelayTime as String: frameDelay]]

        let data = NSMutableData()
        if let destination = CGImageDestinationCreateWithData(data as CFMutableData, kUTTypeGIF, imagesToUse.count, nil) {
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
