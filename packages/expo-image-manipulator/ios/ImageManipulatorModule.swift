// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore
import Photos
internal import SDWebImageWebPCoder
import UIKit

@ExpoModule("ExpoImageManipulator", classes: [ImageManipulatorContext.self, ImageRef.self])
public class ImageManipulatorModule: Module {
  @JS
  func manipulate(source: Either<URL, SharedRef<UIImage>>, options: ImageLoadOptions?) -> ImageManipulatorContext {
    let context = ImageManipulatorContext { [weak appContext] in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      if let url: URL = source.get() {
        return try await loadImage(atUrl: url, appContext: appContext, options: options)
      }
      if let image: SharedRef<UIImage> = source.get() {
        return downscaledIfExceedsBounds(
          image.ref,
          maxWidth: options?.maxWidth.map(Double.init),
          maxHeight: options?.maxHeight.map(Double.init)
        )
      }
      throw Exceptions.RuntimeLost()
    }

    // Immediately try to fix the orientation once the image is loaded
    context.addTransformer(ImageFixOrientationTransformer())

    return context
  }
}
