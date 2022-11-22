// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SDWebImage

public final class ImageModule: Module {
  lazy var prefetcher = SDWebImagePrefetcher.shared

  public func definition() -> ModuleDefinition {
    Name("ExpoImage")

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
}
