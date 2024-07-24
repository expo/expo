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
      ImageModule.registerLoaders()
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

      Prop("placeholderContentFit") { (view, placeholderContentFit: ContentFit?) in
        view.placeholderContentFit = placeholderContentFit ?? .scaleDown
      }

      Prop("contentPosition") { (view, contentPosition: ContentPosition?) in
        view.contentPosition = contentPosition ?? .center
      }

      Prop("transition") { (view, transition: ImageTransition?) in
        view.transition = transition
      }

      Prop("blurRadius") { (view, blurRadius: Double?) in
        let radius = blurRadius ?? .zero
        // the implementation uses Apple's CIGaussianBlur internally
        // we divide the radius to achieve more consistent cross-platform appearance
        // the value was found experimentally
        view.blurRadius = radius / 2.0
      }

      Prop("tintColor") { (view, tintColor: UIColor?) in
        view.imageTintColor = tintColor
      }

      Prop("priority") { (view, priority: ImagePriority?) in
        view.loadingOptions.remove([.lowPriority, .highPriority])

        if let priority = priority?.toSDWebImageOptions() {
          view.loadingOptions.insert(priority)
        }
      }

      Prop("cachePolicy") { (view, cachePolicy: ImageCachePolicy?) in
        view.cachePolicy = cachePolicy ?? .disk
      }

      Prop("enableLiveTextInteraction") { (view, enableLiveTextInteraction: Bool?) in
        #if !os(tvOS)
        view.enableLiveTextInteraction = enableLiveTextInteraction ?? false
        #endif
      }

      Prop("accessible") { (view, accessible: Bool?) in
        view.sdImageView.isAccessibilityElement = accessible ?? false
      }

      Prop("accessibilityLabel") { (view, label: String?) in
        view.sdImageView.accessibilityLabel = label
      }

      Prop("recyclingKey") { (view, key: String?) in
        view.recyclingKey = key
      }

      Prop("allowDownscaling") { (view, allowDownscaling: Bool?) in
        view.allowDownscaling = allowDownscaling ?? true
      }

      Prop("autoplay") { (view, autoplay: Bool?) in
        view.autoplay = autoplay ?? true
      }

      AsyncFunction("startAnimating") { (view: ImageView) in
        view.sdImageView.startAnimating()
      }

      AsyncFunction("stopAnimating") { (view: ImageView) in
        view.sdImageView.stopAnimating()
      }

      OnViewDidUpdateProps { view in
        view.reload()
      }
    }

    AsyncFunction("prefetch") { (urls: [URL], cachePolicy: ImageCachePolicy, headersMap: [String: String]?, promise: Promise) in
      var context = SDWebImageContext()
      let sdCacheType = cachePolicy.toSdCacheType().rawValue
      context[.queryCacheType] = SDImageCacheType.none.rawValue
      context[.storeCacheType] = SDImageCacheType.none.rawValue
      context[.originalQueryCacheType] = sdCacheType
      context[.originalStoreCacheType] = sdCacheType

      var imagesLoaded = 0
      var failed = false

      if headersMap != nil {
        context[.downloadRequestModifier] = SDWebImageDownloaderRequestModifier(headers: headersMap)
      }

      urls.forEach { url in
        SDWebImagePrefetcher.shared.prefetchURLs([url], context: context, progress: nil, completed: { _, skipped in
          if skipped > 0 && !failed {
            failed = true
            promise.resolve(false)
          } else {
            imagesLoaded = imagesLoaded + 1
            if imagesLoaded == urls.count {
              promise.resolve(true)
            }
          }
        })
      }
    }

    AsyncFunction("generateBlurhashAsync") { (url: URL, numberOfComponents: CGSize, promise: Promise) in
      let downloader = SDWebImageDownloader()
      let parsedNumberOfComponents = (Int(numberOfComponents.width), Int(numberOfComponents.height))
      downloader.downloadImage(with: url, progress: nil, completed: { image, _, _, _ in
        DispatchQueue.global().async {
          if let downloadedImage = image {
            let blurhashString = blurhash(fromImage: downloadedImage, numberOfComponents: parsedNumberOfComponents)
            promise.resolve(blurhashString)
          } else {
            promise.reject(BlurhashGenerationException())
          }
        }
      })
    }

    AsyncFunction("clearMemoryCache") { () -> Bool in
      SDImageCache.shared.clearMemory()
      return true
    }

    AsyncFunction("clearDiskCache") { (promise: Promise) in
      SDImageCache.shared.clearDisk {
        promise.resolve(true)
      }
    }

    AsyncFunction("getCachePathAsync") { (cacheKey: String, promise: Promise) in
      /*
       We need to check if the image exists in the cache first since `cachePath` will
       return a path regardless of whether or not the image exists.
       */
      SDImageCache.shared.diskImageExists(withKey: cacheKey) { exists in
        if exists {
          let cachePath = SDImageCache.shared.cachePath(forKey: cacheKey)

          promise.resolve(cachePath)
        } else {
          promise.resolve(nil)
        }
      }
    }
  }

  static func registerCoders() {
    if #available(iOS 14.0, tvOS 14.0, *) {
      // By default Animated WebP is not supported
      SDImageCodersManager.shared.addCoder(SDImageAWebPCoder.shared)
    } else {
      // This coder is much slower, but it's the only one that works in iOS 13
      SDImageCodersManager.shared.addCoder(SDImageWebPCoder.shared)
    }
    SDImageCodersManager.shared.addCoder(SDImageAVIFCoder.shared)
    SDImageCodersManager.shared.addCoder(SDImageSVGCoder.shared)
    SDImageCodersManager.shared.addCoder(SDImageHEICCoder.shared)
  }

  static func registerLoaders() {
    SDImageLoadersManager.shared.addLoader(BlurhashLoader())
    SDImageLoadersManager.shared.addLoader(ThumbhashLoader())
    SDImageLoadersManager.shared.addLoader(PhotoLibraryAssetLoader())
  }
}
