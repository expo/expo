// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SDWebImage
import SDWebImageWebPCoder
import SDWebImageAVIFCoder
import SDWebImageSVGCoder

public final class ImageModule: Module {
  lazy var prefetcher = SDWebImagePrefetcher.shared

  public func definition() -> ModuleDefinition {
    Name("ExpoImage")

    OnCreate {
      ImageModule.registerCoders()
    }

    View(ImageView.self) {
      Events(
        "onLoadStart",
        "onProgress",
        "onError",
        "onLoad"
      )

      Prop("source") { (view, source: ImageSource) in
        view.source = source
      }

      Prop("resizeMode") { (view, resizeMode: ImageResizeMode) in
        view.resizeMode = resizeMode
      }

      Prop("transition") { (view, transition: ImageTransition?) in
        view.transition = transition
      }

      Prop("blurRadius") { (view, blurRadius: Double?) in
        view.blurRadius = blurRadius ?? .zero
      }

      Prop("tintColor") { (view, tintColor: UIColor?) in
        view.imageTintColor = tintColor ?? .clear
      }

      OnViewDidUpdateProps { view in
        view.reload()
      }
    }

    Function("clearMemoryCache") {
      SDImageCache.shared.clearMemory()
    }

    Function("clearDiskCache") {
      SDImageCache.shared.clearDisk()
    }
  }

  static func registerCoders() {
    SDImageCodersManager.shared.addCoder(SDImageWebPCoder.shared)
    SDImageCodersManager.shared.addCoder(SDImageAVIFCoder.shared)
    SDImageCodersManager.shared.addCoder(SDImageSVGCoder.shared)
    SDImageCodersManager.shared.addCoder(SDImageHEICCoder.shared)
  }
}
