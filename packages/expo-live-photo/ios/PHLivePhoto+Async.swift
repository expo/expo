// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import PhotosUI

extension PHLivePhoto {
  class func requestSequence(
    withResourceFileURLs fileURLs: [URL],
    placeholderImage image: UIImage?,
    targetSize: CGSize,
    contentMode: PHImageContentMode
  ) -> AsyncThrowingStream<(Bool, PHLivePhoto), Error> {
    return AsyncThrowingStream { continuation in
      self.request(withResourceFileURLs: fileURLs, placeholderImage: image, targetSize: targetSize, contentMode: contentMode) { livePhoto, loadInfo in
        let isLowQuality = loadInfo[PHLivePhotoInfoIsDegradedKey] as? Bool ?? false
        let error = loadInfo[PHLivePhotoInfoErrorKey] as? Error

        if let error {
          continuation.finish(throwing: error)
          return
        }

        if let livePhoto {
          continuation.yield((isLowQuality, livePhoto))

          if !isLowQuality {
            continuation.finish()
          }
          return
        }

        // No useful data was returned, this means that the provided photo and video urls are not paired.
        continuation.finish(throwing: InvalidSourceException("Provided photo and video urls are not paired"))
      }
    }
  }
}
