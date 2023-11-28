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

  let sdImageView = SDAnimatedImageView(frame: .zero)

  // Custom image manager doesn't use shared loaders managers by default,
  // so make sure it is provided here.
  let imageManager = SDWebImageManager(
    cache: SDImageCache.shared,
    loader: SDImageLoadersManager.shared
  )

  var loadingOptions: SDWebImageOptions = [
    .retryFailed, // Don't blacklist URLs that failed downloading
    .handleCookies // Handle cookies stored in the shared `HTTPCookieStore`
  ]

  var sources: [ImageSource]?

  var pendingOperation: SDWebImageCombinedOperation?

  var contentFit: ContentFit = .cover

  var contentPosition: ContentPosition = .center

  var transition: ImageTransition?

  var blurRadius: CGFloat = 0.0

  var imageTintColor: UIColor?

  var cachePolicy: ImageCachePolicy = .disk

  var allowDownscaling: Bool = true

  var recyclingKey: String? {
    didSet {
      if oldValue != nil && recyclingKey != oldValue {
        sdImageView.image = nil
      }
    }
  }

  var autoplay: Bool = true

  // MARK: - Events

  let onLoadStart = EventDispatcher()

  let onProgress = EventDispatcher()

  let onError = EventDispatcher()

  let onLoad = EventDispatcher()

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
    if sdImageView.image == nil {
      sdImageView.contentMode = contentFit.toContentMode()
    }
    var context = SDWebImageContext()

    // Cancel currently running load requests.
    cancelPendingOperation()

    // Modify URL request to add headers.
    if let headers = source.headers {
      context[SDWebImageContextOption.downloadRequestModifier] = SDWebImageDownloaderRequestModifier(headers: headers)
    }

    context[.cacheKeyFilter] = createCacheKeyFilter(source.cacheKey)
    context[.imageTransformer] = createTransformPipeline()

    // Assets from the bundler have `scale` prop which needs to be passed to the context,
    // otherwise they would be saved in cache with scale = 1.0 which may result in
    // incorrectly rendered images for resize modes that don't scale (`center` and `repeat`).
    context[.imageScaleFactor] = source.scale

    // It seems that `UIImageView` can't tint some vector graphics. If the `tintColor` prop is specified,
    // we tell the SVG coder to decode to a bitmap instead. This will become useless when we switch to SVGNative coder.
    if imageTintColor != nil {
      context[.imageDecodeOptions] = [
        SDImageCoderOption.webImageContext: [
          "svgPrefersBitmap": true,
          "svgImageSize": sdImageView.bounds.size,
          "svgImagePreserveAspectRatio": true
        ]
      ]
    }

    if source.isCachingAllowed {
      let sdCacheType = cachePolicy.toSdCacheType().rawValue
      context[.originalQueryCacheType] = sdCacheType
      context[.originalStoreCacheType] = sdCacheType
    } else {
      context[.originalQueryCacheType] = SDImageCacheType.none.rawValue
      context[.originalStoreCacheType] = SDImageCacheType.none.rawValue
    }
    // Set which cache can be used to query and store the downloaded image.
    // We want to store only original images (without transformations).
    context[.queryCacheType] = SDImageCacheType.none.rawValue
    context[.storeCacheType] = SDImageCacheType.none.rawValue

    // Some loaders (e.g. blurhash) need access to the source and the screen scale.
    context[ImageView.contextSourceKey] = source
    context[ImageView.screenScaleKey] = screenScale

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

    // Create an SDAnimatedImage if needed then handle the image
    if let image = createAnimatedIfNeeded(image: image, data: data) {
      onLoad([
        "cacheType": cacheTypeToString(cacheType),
        "source": [
          "url": imageUrl?.absoluteString,
          "width": image.size.width,
          "height": image.size.height,
          "mediaType": imageFormatToMediaType(image.sd_imageFormat),
          "isAnimated": image.sd_isAnimated ?? false
        ]
      ])

      let scale = window?.screen.scale ?? UIScreen.main.scale
      let idealSize = idealSize(
        contentPixelSize: image.size * image.scale,
        containerSize: frame.size,
        scale: scale,
        contentFit: contentFit
      ).rounded(.up)

      Task {
        let image = await processImage(image, idealSize: idealSize, scale: scale)

        applyContentPosition(contentSize: idealSize, containerSize: frame.size)
        renderImage(image)
      }
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
   Loads a placeholder from the best source provided in `placeholder` prop.
   A placeholder should be a local asset to have more time to show before the proper image is loaded,
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
    let isPlaceholderHash = placeholder.isBlurhash || placeholder.isThumbhash

    context[.imageScaleFactor] = placeholder.scale
    context[.cacheKeyFilter] = createCacheKeyFilter(placeholder.cacheKey)

    // Cache placeholders on the disk. Should we let the user choose whether
    // to cache them or apply the same policy as with the proper image?
    // Basically they are also cached in memory as the `placeholderImage` property,
    // so just `disk` policy sounds like a good idea.
    context[.queryCacheType] = SDImageCacheType.disk.rawValue
    context[.storeCacheType] = SDImageCacheType.disk.rawValue

    // Some loaders (e.g. blurhash) need access to the source.
    context[ImageView.contextSourceKey] = placeholder

    imageManager.loadImage(with: placeholder.uri, context: context, progress: nil) { [weak self] placeholder, _, _, _, finished, _ in
      guard let self = self, let placeholder = placeholder, finished else {
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
    guard isViewEmpty || !hasAnySource, let placeholder = placeholderImage else {
      return
    }
    setImage(placeholder, contentFit: placeholderContentFit, isPlaceholder: true)
  }

  // MARK: - Processing

  private func createTransformPipeline() -> SDImagePipelineTransformer {
    let transformers: [SDImageTransformer] = [
      SDImageBlurTransformer(radius: blurRadius)
    ]
    return SDImagePipelineTransformer(transformers: transformers)
  }

  private func processImage(_ image: UIImage?, idealSize: CGSize, scale: Double) async -> UIImage? {
    guard let image = image, !bounds.isEmpty else {
      return nil
    }
    // Downscale the image only when necessary
    if allowDownscaling && shouldDownscale(image: image, toSize: idealSize, scale: scale) {
      return await resize(animatedImage: image, toSize: idealSize, scale: scale)
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
      let seconds = transition.duration / 1000

      UIView.transition(with: sdImageView, duration: seconds, options: options) { [weak self] in
        if let self = self {
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
