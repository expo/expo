// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

private typealias SDWebImageContext = [SDWebImageContextOption: Any]

public final class ImageView: ExpoView {
  let sdImageView = SDAnimatedImageView(frame: .zero)
  let imageManager = SDWebImageManager()
  var loadingOptions = SDWebImageOptions()

  var sources: [ImageSource]?

  var pendingOperation: SDWebImageCombinedOperation?

  var contentFit: ContentFit = .cover

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
      cancelPendingOperation()
    } else if !bounds.isEmpty {
      // Reload the image after mounting the view with non-empty bounds.
      reload()
    } else {
      loadPlaceholderIfNecessary()
    }
  }

  // MARK: - Implementation

  func reload() {
    if isViewEmpty {
      displayPlaceholderIfNecessary()
    }
    guard let source = bestSource else {
      displayPlaceholderIfNecessary()
      return
    }
    var context = SDWebImageContext()

    // Cancel currently running load requests.
    cancelPendingOperation()

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

    pendingOperation = imageManager.loadImage(
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
      displayPlaceholderIfNecessary()
    }
  }

  // MARK: - Placeholder

  /**
   A list of sources that the placeholder can be loaded from.
   */
  var placeholderSources: [ImageSource] = [] {
    didSet {
      loadPlaceholderIfNecessary()
    }
  }

  /**
   A placeholder image to use when the proper image is unset.
   */
  var placeholderImage: UIImage?

  /**
   Same as `bestSource`, but for placeholders.
   */
  var bestPlaceholder: ImageSource? {
    return getBestSource(from: placeholderSources, forSize: bounds.size, scale: screenScale) ?? placeholderSources.first
  }

  /**
   Loads a placeholder from the best source provided in `placeholder` prop.
   A placeholder should be a local asset to has more time to show before the proper image is loaded,
   but remote assets are also supported – for the bundler and to cache them on the disk to load faster next time.
   - Note: Placeholders are not being resized nor transformed, so try to keep them small.
   */
  func loadPlaceholderIfNecessary() {
    // Exit early if placeholder is not set or there is already an image attached to the view.
    // The placeholder is only used until the first image is loaded.
    guard let placeholder = bestPlaceholder, isViewEmpty || !hasAnySource else {
      return
    }
    var context = SDWebImageContext()

    context[.imageScaleFactor] = placeholder.scale

    // Cache placeholders on the disk. Should we let the user choose whether
    // to cache them or apply the same policy as with the proper image?
    // Basically they are also cached in memory as the `placeholderImage` property,
    // so just `disk` policy sounds like a good idea.
    context[.queryCacheType] = SDImageCacheType.disk.rawValue
    context[.storeCacheType] = SDImageCacheType.disk.rawValue

    imageManager.loadImage(with: placeholder.uri, context: context, progress: nil) { [weak self] placeholder, _, _, _, finished, _ in
      guard let self = self, let placeholder = placeholder, finished else {
        return
      }
      self.placeholderImage = placeholder
      self.displayPlaceholderIfNecessary()
    }
  }

  /**
   Displays a placeholder if necessary – the placeholder can only be displayed when no image has been displayed yet or the sources are unset.
   */
  private func displayPlaceholderIfNecessary() {
    guard isViewEmpty || !hasAnySource, let placeholder = placeholderImage else {
      return
    }
    // The placeholder should always use `scale-down` content fitting (which maps to `UIView.ContentMode.center`).
    setImage(placeholder, contentFit: .scaleDown)
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
      UIView.transition(with: sdImageView, duration: transition.duration, options: options) { [weak self] in
        if let self = self {
          self.setImage(image, contentFit: self.contentFit)
        }
      }
    } else {
      setImage(image, contentFit: contentFit)
    }
  }

  private func setImage(_ image: UIImage?, contentFit: ContentFit) {
    sdImageView.contentMode = contentFit.toContentMode()
    sdImageView.image = image
  }

  // MARK: - Helpers

  func cancelPendingOperation() {
    pendingOperation?.cancel()
    pendingOperation = nil
  }

  /**
   A scale of the screen where the view is presented,
   or the main scale if the view is not mounted yet.
   */
  var screenScale: Double {
    return window?.screen.scale as? Double ?? UIScreen.main.scale
  }

  /**
   The image source that fits best into the view bounds.
   */
  var bestSource: ImageSource? {
    return getBestSource(from: sources, forSize: bounds.size, scale: screenScale)
  }

  /**
   A bool value whether the image view doesn't render any image.
   */
  var isViewEmpty: Bool {
    return sdImageView.image == nil
  }

  /**
   A bool value whether there is any source to load from.
   */
  var hasAnySource: Bool {
    return sources?.isEmpty == false
  }
}
