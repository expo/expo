// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import Photos
import UIKit
import ExpoModulesCore
import SDWebImageWebPCoder

public class ImageManipulatorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoImageManipulator")

    Function("manipulate") { (source: Either<URL, SharedRef<UIImage>>) -> ImageManipulatorContext in
      let context = ImageManipulatorContext { [weak appContext] in
        guard let appContext else {
          throw Exceptions.AppContextLost()
        }
        if let url: URL = source.get() {
          return try await loadImage(atUrl: url, appContext: appContext)
        }
        if let image: SharedRef<UIImage> = source.get() {
          return image.ref
        }
        throw Exceptions.RuntimeLost()
      }

      // Immediately try to fix the orientation once the image is loaded
      context.addTransformer(ImageFixOrientationTransformer())

      return context
    }

    Class("Context", ImageManipulatorContext.self) {
      Function("resize") { (context: ImageManipulatorContext, options: ResizeOptions) -> ImageManipulatorContext in
        return context.addTransformer(ImageResizeTransformer(options: options))
      }

      Function("rotate") { (context: ImageManipulatorContext, rotate: Double) -> ImageManipulatorContext in
        return context.addTransformer(ImageRotateTransformer(rotate: rotate))
      }

      Function("flip") { (context: ImageManipulatorContext, flipType: FlipType) -> ImageManipulatorContext in
        return context.addTransformer(ImageFlipTransformer(flip: flipType))
      }

      Function("crop") { (context: ImageManipulatorContext, rect: CropRect) -> ImageManipulatorContext in
        return context.addTransformer(ImageCropTransformer(options: rect))
      }

      Function("reset") { (context: ImageManipulatorContext) -> ImageManipulatorContext in
        context.reset()
        return context
      }

      AsyncFunction("renderAsync") { (context: ImageManipulatorContext) -> ImageRef in
        let image = try await context.render()
        return ImageRef(image)
      }
    }

    Class("Image", ImageRef.self) {
      Property("width") { (image: ImageRef) -> Int in
        return image.ref.cgImage?.width ?? 0
      }

      Property("height") { (image: ImageRef) -> Int in
        return image.ref.cgImage?.height ?? 0
      }

      AsyncFunction("saveAsync") { (image: ImageRef, options: ManipulateOptions?) -> [String: Any?] in
        guard let appContext else {
          throw Exceptions.AppContextLost()
        }
        let options = options ?? ManipulateOptions()
        let result = try saveImage(image.ref, options: options, appContext: appContext)

        // We're returning a dict instead of a path directly because in the future we'll replace it
        // with a shared ref to the file once this feature gets implemented in expo-file-system.
        // This should be fully backwards-compatible switch.
        return [
          "uri": result.url.absoluteString,
          "width": image.ref.cgImage?.width ?? 0,
          "height": image.ref.cgImage?.height ?? 0,
          "base64": options.base64 ? result.data.base64EncodedString() : nil
        ]
      }
    }
  }
}
