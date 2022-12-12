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

      Prop("source") { (view, sources: [ImageSource]?) in
        view.sources = sources
      }

      Prop("placeholder") { (view, placeholders: [ImageSource]?) in
        view.placeholderSources = placeholders ?? []
      }

      Prop("contentFit") { (view, contentFit: ContentFit?) in
        view.contentFit = contentFit ?? .cover
      }

      Prop("contentPosition") { (view, contentPosition: ContentPosition?) in
        view.contentPosition = contentPosition ?? .center
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

      Prop("priority") { (view, priority: ImagePriority?) in
        view.loadingOptions.remove([.lowPriority, .highPriority])

        if let priority = priority?.toSDWebImageOptions() {
          view.loadingOptions.insert(priority)
        }
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
