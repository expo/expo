// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore
#if !os(tvOS)
import VisionKit
#endif

typealias SDWebImageContext = [SDWebImageContextOption: Any]

// swiftlint:disable:next type_body_length
public final class ImageView: ExpoView {
  static let contextSourceKey = SDWebImageContextOption(rawValue: "source")
  static let screenScaleKey = SDWebImageContextOption(rawValue: "screenScale")
  static let contentFitKey = SDWebImageContextOption(rawValue: "contentFit")
  static let frameSizeKey = SDWebImageContextOption(rawValue: "frameSize")

  let sdImageView = SDAnimatedImageView(frame: .zero)

  // Custom image manager doesn't use shared loaders managers by default,
  // so make sure it is provided here.
  let imageManager = SDWebImageManager(
    cache: SDImageCache.shared,
    loader: SDImageLoadersManager.shared
  )

  var loadingOptions: SDWebImageOptions = [
    .retryFailed, // Don't blacklist URLs that failed downloading
    .handleCookies, // Handle cookies stored in the shared `HTTPCookieStore`
    // Images from cache are `AnimatedImage`s. BlurRadius is done via a SDImageBlurTransformer
    // so this flag needs to be enabled. Beware most transformers cannot manage animated images.
    .transformAnimatedImage
  ]

  /**
   An array of sources from which the view will asynchronously load one of them that fits best into the view bounds.
   */
  var sources: [ImageSource]?

  /**
   An image that has been loaded from one of the `sources` or set by the shared ref to an image.
   */
  var sourceImage: UIImage?

  var pendingOperation: SDWebImageCombinedOperation?

  var contentFit: ContentFit = .cover

  var contentPosition: ContentPosition = .center

  var transition: ImageTransition?

  var blurRadius: CGFloat = 0.0

  var imageTintColor: UIColor?

  var cachePolicy: ImageCachePolicy = .disk

  var allowDownscaling: Bool = true

  var lockResource: Bool = false

  var enforceEarlyResizing: Bool = false

  var recyclingKey: String? {
    didSet {
      if oldValue != nil && recyclingKey != oldValue {
        sdImageView.image = nil
      }
    }
  }

  var autoplay: Bool = true

  var useAppleWebpCodec: Bool = true

  /**
   The ideal image size that fills in the container size while maintaining the source aspect ratio.
   */
  var imageIdealSize: CGSize = .zero

  // MARK: - Events

  let onLoadStart = EventDispatcher()

  let onProgress = EventDispatcher()

  let onError = EventDispatcher()

  let onLoad = EventDispatcher()

  let onDisplay = EventDispatcher()

  // MARK: - View

  public override var bounds: CGRect {
    didSet {
      // Reload the image when the bounds size has changed and is not empty.
      if oldValue.size != bounds.size && bounds.size != .zero {
        reload()
      }
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    sdImageView.contentMode = contentFit.toContentMode()
    sdImageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    sdImageView.layer.masksToBounds = false

    // Apply trilinear filtering to smooth out mis-sized images.
    sdImageView.layer.magnificationFilter = .trilinear
    sdImageView.layer.minificationFilter = .trilinear

    addSubview(sdImageView)
  }

  deinit {
    // Cancel pending requests when the view is deallocated.
    cancelPendingOperation()
  }

  public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    if self.traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) {
      // The mask layer we adjusted would be invaliated from `RCTViewComponentView.traitCollectionDidChange`.
      // After that we have to recalculate the mask layer in `applyContentPosition`.
      applyContentPosition(contentSize: imageIdealSize, containerSize: frame.size)
    }
  }

  // MARK: - Implementation

  func reload(force: Bool = false) {
    if lockResource && !force {
      return
    }
    if isViewEmpty {
      displayPlaceholderIfNecessary()
    }
    guard let source = bestSource else {
      displayPlaceholderIfNecessary()
      return
    }
    if sdImageView.image == nil {
      sdImageView.contentMode = contentFit.toContentMode()
    }
    var context = createSDWebImageContext(forSource: source, cachePolicy: cachePolicy, useAppleWebpCodec: useAppleWebpCodec)

    // Cancel currently running load requests.
    cancelPendingOperation()

    if blurRadius > 0 {
      context[.imageTransformer] = createTransformPipeline()
    }

    // It seems that `UIImageView` can't tint some vector graphics. If the `tintColor` prop is specified,
    // we tell the SVG coder to decode to a bitmap instead. This will become useless when we switch to SVGNative coder.
    let shouldEarlyResize = imageTintColor != nil || enforceEarlyResizing || source.isPhotoLibraryAsset
    if shouldEarlyResize {
      context[.imagePreserveAspectRatio] = true
      context[.imageThumbnailPixelSize] = CGSize(
        width: sdImageView.bounds.size.width * screenScale,
        height: sdImageView.bounds.size.height * screenScale
      )
    }

    // Some loaders (e.g. PhotoLibraryAssetLoader) may need to know the screen scale.
    context[ImageView.screenScaleKey] = screenScale
    context[ImageView.frameSizeKey] = frame.size
    context[ImageView.contentFitKey] = contentFit

    // Do it here so we don't waste resources trying to fetch from a remote URL
    if maybeRenderLocalAsset(from: source) {
      return
    }

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
    // Don't send the event when the expected size is unknown (it's usually -1 or 0 when called for the first time).
    if expectedSize <= 0 {
      return
    }

    // Photos library requester emits the progress as a double `0...1` that we map to `0...100` int in `PhotosLoader`.
    // When that loader is used, we don't have any information about the sizes in bytes, so we only send the `progress` param.
    let isPhotoLibraryAsset = isPhotoLibraryAssetUrl(imageUrl)

    onProgress([
      "loaded": isPhotoLibraryAsset ? nil : receivedSize,
      "total": isPhotoLibraryAsset ? nil : expectedSize,
      "progress": Double(receivedSize) / Double(expectedSize)
    ])
  }

  // swiftlint:disable:next function_parameter_count
  private func imageLoadCompleted(
    _ image: UIImage?,
    _ data: Data?,
    _ error: Error?,
    _ cacheType: SDImageCacheType,
    _ finished: Bool,
    _ imageUrl: URL?
  ) {
    if let error = error {
      let code = (error as NSError).code

      // SDWebImage throws an error when loading operation is canceled (interrupted) by another load request.
      // We do want to ignore that one and wait for the new request to load.
      if code != SDWebImageError.cancelled.rawValue {
        onError(["error": error.localizedDescription])
      }
      return
    }
    guard finished else {
      log.debug("Loading the image has been canceled")
      return
    }

    if let image {
      onLoad([
        "cacheType": cacheTypeToString(cacheType),
        "source": [
          "url": imageUrl?.absoluteString,
          "width": image.size.width,
          "height": image.size.height,
          "mediaType": imageFormatToMediaType(image.sd_imageFormat),
          "isAnimated": image.sd_isAnimated
        ]
      ])

      let scale = window?.screen.scale ?? UIScreen.main.scale
      imageIdealSize = idealSize(
        contentPixelSize: image.size * image.scale,
        containerSize: frame.size,
        scale: scale,
        contentFit: contentFit
      ).rounded(.up)

      let image = processImage(image, idealSize: imageIdealSize, scale: scale)
      applyContentPosition(contentSize: imageIdealSize, containerSize: frame.size)
      renderSourceImage(image)
    } else {
      displayPlaceholderIfNecessary()
    }
  }

  private func maybeRenderLocalAsset(from source: ImageSource) -> Bool {
    let path: String? = {
      // .path() on iOS 16 would remove the leading slash, but it doesn't on tvOS 16 🙃
      // It also crashes with EXC_BREAKPOINT when parsing data:image uris
      // manually drop the leading slash below iOS 16
      if let path = source.uri?.path {
        return String(path.dropFirst())
      }
      return nil
    }()

    if let path, !path.isEmpty, let local = UIImage(named: path) {
      renderSourceImage(local)
      return true
    }

    return false
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
   Content fit for the placeholder. `scale-down` seems to be the best choice for spinners
   and that the placeholders are usually smaller than the proper image, but it doesn't
   apply to blurhash that by default could use the same fitting as the proper image.
   */
  var placeholderContentFit: ContentFit = .scaleDown

  /**
   Same as `bestSource`, but for placeholders.
   */
  var bestPlaceholder: ImageSource? {
    return getBestSource(from: placeholderSources, forSize: bounds.size, scale: screenScale) ?? placeholderSources.first
  }

  /**
   A bool value whether the placeholder can be displayed, i.e. nothing has been displayed yet or the sources are unset.
   */
  var canDisplayPlaceholder: Bool {
    return isViewEmpty || (!hasAnySource && sourceImage == nil)
  }

  /**
   Loads a placeholder from the best source provided in `placeholder` prop.
   A placeholder should be a local asset to have more time to show before the proper image is loaded,
   but remote assets are also supported – for the bundler and to cache them on the disk to load faster next time.
   - Note: Placeholders are not being resized nor transformed, so try to keep them small.
   */
  func loadPlaceholderIfNecessary() {
    // Exit early if placeholder is not set or there is already an image attached to the view.
    // The placeholder is only used until the first image is loaded.
    guard canDisplayPlaceholder, let placeholder = bestPlaceholder else {
      return
    }

    // Cache placeholders on the disk. Should we let the user choose whether
    // to cache them or apply the same policy as with the proper image?
    // Basically they are also cached in memory as the `placeholderImage` property,
    // so just `disk` policy sounds like a good idea.
    var context = createSDWebImageContext(forSource: placeholder, cachePolicy: .disk, useAppleWebpCodec: useAppleWebpCodec)

    let isPlaceholderHash = placeholder.isBlurhash || placeholder.isThumbhash

    imageManager.loadImage(with: placeholder.uri, context: context, progress: nil) { [weak self] placeholder, _, _, _, finished, _ in
      guard let self, let placeholder, finished else {
        return
      }
      self.placeholderImage = placeholder
      self.placeholderContentFit = isPlaceholderHash ? self.contentFit : self.placeholderContentFit
      self.displayPlaceholderIfNecessary()
    }
  }

  /**
   Displays a placeholder if necessary – the placeholder can only be displayed when no image has been displayed yet or the sources are unset.
   */
  private func displayPlaceholderIfNecessary() {
    guard canDisplayPlaceholder, let placeholder = placeholderImage else {
      return
    }
    setImage(placeholder, contentFit: placeholderContentFit, isPlaceholder: true)
  }

  // MARK: - Processing

  private func createTransformPipeline() -> SDImagePipelineTransformer? {
    let transformers: [SDImageTransformer] = [
      SDImageBlurTransformer(radius: blurRadius)
    ]
    return SDImagePipelineTransformer(transformers: transformers)
  }

  private func processImage(_ image: UIImage?, idealSize: CGSize, scale: Double) -> UIImage? {
    guard let image = image, !bounds.isEmpty else {
      return nil
    }
    sdImageView.animationTransformer = nil
    // Downscale the image only when necessary
    if allowDownscaling && shouldDownscale(image: image, toSize: idealSize, scale: scale) {
      if image.sd_isAnimated {
        let size = idealSize * scale
        sdImageView.animationTransformer = SDImageResizingTransformer(size: size, scaleMode: .fill)
        return image
      }
      return resize(image: image, toSize: idealSize, scale: scale)
    }
    return image
  }

  // MARK: - Rendering

  /**
   Moves the layer on which the image is rendered to respect the `contentPosition` prop.
   */
  private func applyContentPosition(contentSize: CGSize, containerSize: CGSize) {
    let offset = contentPosition.offset(contentSize: contentSize, containerSize: containerSize)
    if sdImageView.layer.mask != nil {
      // In New Architecture mode, React Native adds a mask layer to image subviews.
      // When moving the layer frame, we must move the mask layer with a compensation value.
      // This prevents the layer from being cropped.
      // See https://github.com/expo/expo/issues/34201
      // and https://github.com/facebook/react-native/blob/c72d4c5ee97/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm#L1066-L1076
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      sdImageView.layer.frame.origin = offset
      sdImageView.layer.mask?.frame.origin = CGPoint(x: -offset.x, y: -offset.y)
      CATransaction.commit()
    } else {
      sdImageView.layer.frame.origin = offset
    }
  }

  internal func renderSourceImage(_ image: UIImage?) {
    // Update the source image before it gets rendered or transitioned to.
    sourceImage = image

    if let transition = transition, transition.duration > 0 {
      let options = transition.toAnimationOptions()
      let seconds = transition.duration / 1000

      UIView.transition(with: sdImageView, duration: seconds, options: options) { [weak self] in
        if let self {
          self.setImage(image, contentFit: self.contentFit, isPlaceholder: false)
        }
      }
    } else {
      setImage(image, contentFit: contentFit, isPlaceholder: false)
    }
  }

  private func setImage(_ image: UIImage?, contentFit: ContentFit, isPlaceholder: Bool) {
    sdImageView.contentMode = contentFit.toContentMode()

    if isPlaceholder {
      sdImageView.autoPlayAnimatedImage = true
    } else {
      sdImageView.autoPlayAnimatedImage = autoplay
    }

    if let imageTintColor, !isPlaceholder {
      sdImageView.tintColor = imageTintColor
      sdImageView.image = image?.withRenderingMode(.alwaysTemplate)
    } else {
      sdImageView.tintColor = nil
      sdImageView.image = image
    }

    if !isPlaceholder {
      onDisplay()
    }

#if !os(tvOS)
    if enableLiveTextInteraction {
      analyzeImage()
    }
#endif
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

  // MARK: - Live Text Interaction
#if !os(tvOS)
  @available(iOS 16.0, macCatalyst 17.0, *)
  static let imageAnalyzer = ImageAnalyzer.isSupported ? ImageAnalyzer() : nil

  var enableLiveTextInteraction: Bool = false {
    didSet {
      guard #available(iOS 16.0, macCatalyst 17.0, *), oldValue != enableLiveTextInteraction, ImageAnalyzer.isSupported else {
        return
      }
      if enableLiveTextInteraction {
        let imageAnalysisInteraction = ImageAnalysisInteraction()
        sdImageView.addInteraction(imageAnalysisInteraction)
      } else if let interaction = findImageAnalysisInteraction() {
        sdImageView.removeInteraction(interaction)
      }
    }
  }

  private func analyzeImage() {
    guard #available(iOS 16.0, macCatalyst 17.0, *), ImageAnalyzer.isSupported, let image = sdImageView.image else {
      return
    }

    Task {
      guard let imageAnalyzer = Self.imageAnalyzer, let imageAnalysisInteraction = findImageAnalysisInteraction() else {
        return
      }
      let configuration = ImageAnalyzer.Configuration([.text, .machineReadableCode])

      do {
        let imageAnalysis = try await imageAnalyzer.analyze(image, configuration: configuration)

        // Make sure the image haven't changed in the meantime.
        if image == sdImageView.image {
          imageAnalysisInteraction.analysis = imageAnalysis
          imageAnalysisInteraction.preferredInteractionTypes = .automatic
        }
      } catch {
        log.error(error)
      }
    }
  }

  @available(iOS 16.0, macCatalyst 17.0, *)
  private func findImageAnalysisInteraction() -> ImageAnalysisInteraction? {
    let interaction = sdImageView.interactions.first {
      return $0 is ImageAnalysisInteraction
    }
    return interaction as? ImageAnalysisInteraction
  }
#endif
}
