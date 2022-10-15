// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

private typealias SDWebImageContext = [SDWebImageContextOption: Any]

public final class ImageView: ExpoView {
  let sdImageView = SDAnimatedImageView(frame: .zero)
  let imageManager = SDWebImageManager()

  var source: ImageSource?

  var resizeMode: ImageResizeMode = .cover {
    didSet {
      sdImageView.contentMode = resizeMode.toContentMode()
    }
  }

  var transition: ImageTransition?

  var blurRadius: CGFloat = 0.0

  var imageTintColor: UIColor = .clear

  // MARK: - Events

  let onLoadStart = EventDispatcher()

  let onProgress = EventDispatcher()

  let onError = EventDispatcher()

  let onLoad = EventDispatcher()

  // MARK: - ExpoView

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    sdImageView.contentMode = .scaleAspectFill
    sdImageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    sdImageView.layer.masksToBounds = true

    addSubview(sdImageView)
  }

  // MARK: - Implementation

  func reload() {
    guard let source = source else {
      renderImage(nil)
      return
    }
    var context = SDWebImageContext()

    // Cancel currently running load requests.
    // Each ImageView instance has its own image manager,
    // so it doesn't affect other views.
    if imageManager.isRunning {
      imageManager.cancelAll()
    }

    // Modify URL request to add headers.
    if let headers = source.headers {
      context[SDWebImageContextOption.downloadRequestModifier] = SDWebImageDownloaderRequestModifier(headers: headers)
    }

    context[SDWebImageContextOption.imageTransformer] = createTransformPipeline()

    onLoadStart([:])

    imageManager.loadImage(with: source.uri,
                           context: context,
                           progress: imageLoadProgress(_:_:_:),
                           completed: imageLoadCompleted(_:_:_:_:_:_:))
  }

  // MARK: - Loading

  private func imageLoadProgress(_ receivedSize: Int, _ expectedSize: Int, _ imageUrl: URL?) {
    onProgress([
      "loaded": receivedSize,
      "total": expectedSize
    ])
  }

  private func imageLoadCompleted(
    _ image: UIImage?,
    _ data: Data?,
    _ error: Error?,
    _ cacheType: SDImageCacheType,
    _ finished: Bool,
    _ imageUrl: URL?
  ) {
    if let error = error {
      onError(["error": error.localizedDescription])
      return
    }
    guard finished else {
      log.debug("Loading the image has been canceled")
      return
    }
    if let image = image {
      onLoad([
        "cacheType": cacheTypeToString(cacheType),
        "source": [
          "url": imageUrl?.absoluteString,
          "width": image.size.width,
          "height": image.size.height,
          "mediaType": imageFormatToMediaType(image.sd_imageFormat)
        ]
      ])
    }
    renderImage(processImage(image))
  }

  // MARK: - Processing

  private func createTransformPipeline() -> SDImagePipelineTransformer {
    let transformers: [SDImageTransformer] = [
      SDImageBlurTransformer(radius: blurRadius),
      SDImageTintTransformer(color: imageTintColor)
    ]
    return SDImagePipelineTransformer(transformers: transformers)
  }

  private func processImage(_ image: UIImage?) -> UIImage? {
    guard let image = image else {
      return nil
    }
    if resizeMode == .repeat {
      return image.resizableImage(withCapInsets: .zero, resizingMode: .tile)
    } else {
      return image.resizableImage(withCapInsets: .zero, resizingMode: .stretch)
    }
  }

  // MARK: - Rendering

  private func renderImage(_ image: UIImage?) {
    if let transition = transition, transition.duration > 0 {
      let options = transition.toAnimationOptions()
      UIView.transition(with: sdImageView, duration: transition.duration, options: options) { [weak sdImageView] in
        sdImageView?.image = image
      }
    } else {
      sdImageView.image = image
    }
  }
}
