// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

private typealias SDWebImageContext = [SDWebImageContextOption: Any]

public final class ImageView: ExpoView {
  let sdImageView = SDAnimatedImageView(frame: .zero)
  let imageManager = SDWebImageManager()
  var loadingOptions = SDWebImageOptions()

  var sources: [ImageSource]?

  var contentFit: ContentFit = .cover {
    didSet {
      sdImageView.contentMode = contentFit.toContentMode()
    }
  }

  var contentPosition: ContentPosition = .center

  var transition: ImageTransition?

  var blurRadius: CGFloat = 0.0

  var imageTintColor: UIColor = .clear

  // MARK: - Events

  let onLoadStart = EventDispatcher()

  let onProgress = EventDispatcher()

  let onError = EventDispatcher()

  let onLoad = EventDispatcher()

  // MARK: - View

  public override var bounds: CGRect {
    didSet {
      // Reload the image when the bounds size has changed and the view is mounted.
      if oldValue.size != bounds.size && window != nil {
        reload()
      }
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    sdImageView.contentMode = .scaleAspectFill
    sdImageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    sdImageView.layer.masksToBounds = false

    // Apply trilinear filtering to smooth out mis-sized images.
    sdImageView.layer.magnificationFilter = .trilinear
    sdImageView.layer.minificationFilter = .trilinear

    addSubview(sdImageView)
  }

  public override func didMoveToWindow() {
    if window == nil {
      // Cancel pending requests when the view is unmounted.
      imageManager.cancelAll()
    } else if !bounds.isEmpty {
      // Reload the image after mounting the view with non-empty bounds.
      reload()
    }
  }

  // MARK: - Implementation

  func reload() {
    guard let source = bestSource else {
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

    // Assets from the bundler have `scale` prop which needs to be passed to the context,
    // otherwise they would be saved in cache with scale = 1.0 which may result in
    // incorrectly rendered images for resize modes that don't scale (`center` and `repeat`).
    context[.imageScaleFactor] = source.scale

    onLoadStart([:])

    imageManager.loadImage(
      with: source.uri,
      options: loadingOptions,
      context: context,
      progress: imageLoadProgress(_:_:_:),
      completed: imageLoadCompleted(_:_:_:_:_:_:)
    )
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

      let scale = window?.screen.scale ?? UIScreen.main.scale
      let idealSize = idealSize(
        contentPixelSize: image.size * image.scale,
        containerSize: frame.size,
        scale: scale,
        contentFit: contentFit
      ).rounded(.up)
      let image = processImage(image, idealSize: idealSize, scale: scale)

      applyContentPosition(contentSize: idealSize, containerSize: frame.size)
      renderImage(image)
    } else {
      renderImage(nil)
    }
  }

  // MARK: - Processing

  private func createTransformPipeline() -> SDImagePipelineTransformer {
    let transformers: [SDImageTransformer] = [
      SDImageBlurTransformer(radius: blurRadius),
      SDImageTintTransformer(color: imageTintColor)
    ]
    return SDImagePipelineTransformer(transformers: transformers)
  }

  private func processImage(_ image: UIImage?, idealSize: CGSize, scale: Double) -> UIImage? {
    guard let image = image, !bounds.isEmpty else {
      return nil
    }
    // Downscale the image only when necessary
    if shouldDownscale(image: image, toSize: idealSize, scale: scale) {
      return resize(animatedImage: image, toSize: idealSize, scale: scale)
    }
    return image
  }

  // MARK: - Rendering

  /**
   Moves the layer on which the image is rendered to respect the `contentPosition` prop.
   */
  private func applyContentPosition(contentSize: CGSize, containerSize: CGSize) {
    let offset = contentPosition.offset(contentSize: contentSize, containerSize: containerSize)
    sdImageView.layer.frame.origin = offset
  }

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

  // MARK: - Helpers

  /**
   The image source that fits best into the view bounds, that is the one with the closest number of pixels.
   May be `nil` if there are no sources available or the view bounds size is zero.
   */
  var bestSource: ImageSource? {
    guard let sources = sources, !sources.isEmpty else {
      return nil
    }
    if bounds.isEmpty, window == nil {
      return nil
    }
    if sources.count == 1 {
      return sources.first
    }
    let scale = window?.screen.scale ?? UIScreen.main.scale
    var bestSource: ImageSource?
    var bestFit = Double.infinity
    let targetPixelCount = bounds.width * bounds.height * scale * scale

    for source in sources {
      let fit = abs(1 - (source.pixelCount / targetPixelCount))

      if fit < bestFit {
        bestSource = source
        bestFit = fit
      }
    }
    return bestSource
  }
}
