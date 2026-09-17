// Copyright 2022-present 650 Industries. All rights reserved.

internal import SDWebImage
internal import SDWebImageSVGCoder
import ExpoModulesCore
import Symbols
#if !os(tvOS) && !os(macOS)
import VisionKit
#endif

typealias SDWebImageContext = [SDWebImageContextOption: Any]

// swiftlint:disable:next type_body_length
public final class ImageView: ExpoView {
  nonisolated static let contextSourceKey = SDWebImageContextOption(rawValue: "source")
  nonisolated static let screenScaleKey = SDWebImageContextOption(rawValue: "screenScale")
  nonisolated static let contentFitKey = SDWebImageContextOption(rawValue: "contentFit")
  nonisolated static let frameSizeKey = SDWebImageContextOption(rawValue: "frameSize")

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

  /// Rebuilds the image from a substituted SVG document after the manager delivered the original.
  var pendingSVGVariablesTask: Task<Void, Never>?

  var contentFit: ContentFit = .cover

  var contentPosition: ContentPosition = .center

  var transition: ImageTransition?

  var blurRadius: CGFloat = 0.0

  var imageTintColor: UIColor?

  /// Values for the CSS custom properties — `var(--name)` — used by an SVG source. They are
  /// substituted into the document before it is parsed, so the image stays a vector and different
  /// parts of one document can be given different values.
  ///
  /// Not limited to colors: anything a custom property can stand in for, such as `stroke-width` or
  /// `opacity`, works the same way.
  /// `nil` leaves SVG documents untouched. An empty map still resolves `var()` fallbacks.
  var svgVariables: [String: String]?

  var cachePolicy: ImageCachePolicy = .disk

  var allowDownscaling: Bool = true

  var lockResource: Bool = false

  var enforceEarlyResizing: Bool = false

  var recyclingKey: String? {
    didSet {
      if oldValue != nil && recyclingKey != oldValue {
        sdImageView.image = nil
        placeholderImage = nil
        sourceImage = nil
      }
    }
  }

  var autoplay: Bool = true

  var sfEffect: [SFSymbolEffect]?

  var symbolWeight: String?

  var symbolSize: Double?

  var useAppleWebpCodec: Bool = true

  /**
   Tracks whether the current image is an SF Symbol for animation control.
   */
  var isSFSymbolSource: Bool = false

  /**
   `idealSize` before rounding, used only for `contentPosition` math so alignment matches true cover/contain geometry.
   */
  var imageLayoutSize: CGSize = .zero

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

    #if os(macOS)
    wantsLayer = true
    layer?.masksToBounds = true // macOS equivalent of `clipsToBounds = true` on UIView.
    sdImageView.imageScaling = contentFit.toImageScaling()
    sdImageView.autoresizingMask = [.width, .height]
    // We deliberately don't set `sdImageView.wantsLayer = true` on macOS: explicit layer backing
    // pushes `NSImageView` into a CALayer `.contents` rendering path that bypasses
    // `contentTintColor` for template images, breaking SF Symbol / tint props. Keeping the inner
    // view in its default rendering mode preserves tinting (matches the `expo-symbols` pattern).
    #else
    clipsToBounds = true
    sdImageView.contentMode = contentFit.toContentMode()
    sdImageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    sdImageView.layer.masksToBounds = false

    // Apply trilinear filtering to smooth out mis-sized images.
    sdImageView.layer.magnificationFilter = .trilinear
    sdImageView.layer.minificationFilter = .trilinear
    #endif

    addSubview(sdImageView)
  }

  deinit {
    // Cancel pending requests when the view is deallocated.
    cancelPendingOperation()
  }

  #if os(macOS)
  public override func viewDidChangeEffectiveAppearance() {
    super.viewDidChangeEffectiveAppearance()
    // Mirror the iOS appearance-change hook so the layer mask geometry stays in sync after dark/light flips.
    applyContentPosition(contentSize: imageLayoutSize, containerSize: frame.size)
  }
  #else
  public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    if self.traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) {
      // The mask layer we adjusted would be invalidated from `RCTViewComponentView.traitCollectionDidChange`.
      // After that we have to recalculate the mask layer in `applyContentPosition`.
      applyContentPosition(contentSize: imageLayoutSize, containerSize: frame.size)
    }
  }
  #endif

  // MARK: - Implementation

  func reload(force: Bool = false) {
    if lockResource && !force {
      return
    }
    if isViewEmpty {
      if placeholderImage != nil {
        displayPlaceholderIfNecessary()
      } else {
        loadPlaceholderIfNecessary()
      }
    }
    guard let source = bestSource else {
      displayPlaceholderIfNecessary()
      return
    }

    // Track if this is an SF Symbol source for animation handling
    isSFSymbolSource = source.isSFSymbol

    if sdImageView.image == nil {
      applyContentFit(contentFit)
    }
    var context = createBaseImageContext(source: source)

    // Cancel currently running load requests.
    cancelPendingOperation()

    if blurRadius > 0 {
      context[.imageTransformer] = createTransformPipeline()
    }

    if let thumbnailPixelSize = thumbnailPixelSize(for: source) {
      context[.imagePreserveAspectRatio] = true
      context[.imageThumbnailPixelSize] = thumbnailPixelSize
    }

    // Some loaders (e.g. PhotoLibraryAssetLoader) may need to know the screen scale.
    context[ImageView.screenScaleKey] = screenScale
    context[ImageView.frameSizeKey] = frame.size
    context[ImageView.contentFitKey] = contentFit

    // Do it here so we don't waste resources trying to fetch from a remote URL
    if maybeRenderLocalAsset(from: source) {
      return
    }

    // Render SF Symbols directly without going through SDWebImage to preserve symbol properties
    if source.isSFSymbol {
      renderSFSymbol(from: source)
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

  /// The pixel size to decode a vector source to a bitmap at, or `nil` to keep it a vector.
  /// It seems that `UIImageView` can't tint some vector graphics. If the `tintColor` prop is specified,
  /// we tell the SVG coder to decode to a bitmap instead. This will become useless when we switch to SVGNative coder.
  private func thumbnailPixelSize(for source: ImageSource?) -> CGSize? {
    let isPhotoLibraryAsset = source?.isPhotoLibraryAsset ?? false
    guard imageTintColor != nil || enforceEarlyResizing || isPhotoLibraryAsset else {
      return nil
    }
    return CGSize(
      width: sdImageView.bounds.size.width * screenScale,
      height: sdImageView.bounds.size.height * screenScale
    )
  }

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
    guard let image else {
      displayPlaceholderIfNecessary()
      return
    }

    // The manager delivered the original document, which is all it ever caches. With variables set the
    // image it decoded is discarded, not shown, and rebuilt from the substituted document. A memory hit
    // or a transformed image comes without data, but `SVGCoder` left the document on the image.
    let document = data ?? (image.sd_extendedObject as? Data)
    if let variables = svgVariables, let document, SDImageSVGCoder.shared.canDecode(from: document) {
      substituteSVGVariables(variables, in: document, replacing: image, cacheType: cacheType, imageUrl: imageUrl)
      return
    }
    didLoad(image, cacheType: cacheType, imageUrl: imageUrl)
  }

  /// Rebuilds the image from the original SVG document with the variables substituted, then displays
  /// it in place of the one the manager decoded. Only that original is ever cached, under its plain
  /// key, so variants share one download and a substituted image can never be served for another set
  /// of variables or for a load without any.
  private func substituteSVGVariables(
    _ variables: [String: String],
    in data: Data,
    replacing original: UIImage,
    cacheType: SDImageCacheType,
    imageUrl: URL?
  ) {
    let scale = imageScale(original)
    let thumbnailPixelSize = thumbnailPixelSize(for: bestSource)

    pendingSVGVariablesTask = Task { [weak self] in
      // Parsing happens off the main actor. The view is main-actor isolated, so the rest of this task is too.
      let result = await Task.detached(priority: .userInitiated) {
        SubstitutedSVG(image: Self.decodeSVG(data, variables: variables, scale: scale, thumbnailPixelSize: thumbnailPixelSize))
      }.value
      // A newer load may have superseded this one while parsing.
      guard let self, !Task.isCancelled else {
        return
      }
      self.pendingSVGVariablesTask = nil
      guard let image = result.image else {
        self.onError([
          "error": "Failed to parse the SVG document after substituting its variables. "
            + "The substituted document may not be valid SVG — check the values passed to `svgVariables`."
        ])
        return
      }
      self.didLoad(image, cacheType: cacheType, imageUrl: imageUrl)
    }
  }

  private nonisolated static func decodeSVG(
    _ data: Data,
    variables: [String: String],
    scale: CGFloat,
    thumbnailPixelSize: CGSize?
  ) -> UIImage? {
    let substituted = SVGVariables.substitute(in: data, variables: variables)
    var options: [SDImageCoderOption: Any] = [.decodeScaleFactor: scale]

    // Without a thumbnail size the SVG coder takes its vector branch, which keeps the image sharp at
    // any size. The view asks for one when it needs a bitmap, as `tintColor` does.
    if let thumbnailPixelSize {
      options[.decodeThumbnailPixelSize] = thumbnailPixelSize
      options[.decodePreserveAspectRatio] = true
    }
    return SDImageSVGCoder.shared.decodedImage(with: substituted, options: options)
  }

  /// Reports a finished load and displays the image.
  private func didLoad(_ image: UIImage, cacheType: SDImageCacheType, imageUrl: URL?) {
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

    appContext?.moduleRegistry.getModule(implementing: ImageModule.self)?.emitImageLoaded(
      url: imageUrl?.absoluteString ?? "",
      width: image.size.width * imageScale(image),
      height: image.size.height * imageScale(image)
    )

    let scale = displayScale
    imageLayoutSize = idealSize(
      contentPixelSize: image.size * imageScale(image),
      containerSize: frame.size,
      scale: scale,
      contentFit: contentFit
    )
    let imageIdealSize = imageLayoutSize.rounded(.up)
    let image = processImage(image, idealSize: imageIdealSize, scale: scale)
    applyContentPosition(contentSize: imageLayoutSize, containerSize: frame.size)
    renderSourceImage(image, cacheType: ImageCacheType.fromSdCacheType(cacheType))
  }

  private func renderSFSymbol(from source: ImageSource) {
    guard let uri = source.uri else {
      return
    }

    // Extract symbol name from URL path (e.g., sf:/star.fill)
    let symbolName = uri.pathComponents.count > 1 ? uri.pathComponents[1] : ""

    // Create symbol with configuration using the symbolWeight and symbolSize props
    let weight = parseSymbolWeight(symbolWeight)
    let pointSize = symbolSize ?? 100
    let configuration = UIImage.SymbolConfiguration(pointSize: pointSize, weight: weight)
    guard let image = systemSymbolImage(named: symbolName, configuration: configuration) else {
      onError(["error": "Unable to create SF Symbol image for '\(symbolName)'"])
      return
    }

    onLoad([
      "cacheType": "none",
      "source": [
        "url": uri.absoluteString,
        "width": image.size.width,
        "height": image.size.height,
        "mediaType": nil,
        "isAnimated": false
      ]
    ])

    let scale = displayScale
    imageLayoutSize = idealSize(
      contentPixelSize: image.size * imageScale(image),
      containerSize: frame.size,
      scale: scale,
      contentFit: contentFit
    )

    applyContentPosition(contentSize: imageLayoutSize, containerSize: frame.size)
    renderSFSymbolImage(image)
  }

  private func renderSFSymbolImage(_ image: UIImage) {
    sourceImage = image

    applyContentFit(contentFit)

    let templateImage = makeTemplateImage(from: image)

    #if !os(macOS)
    applyImageTint(imageTintColor)
    // Use replace content transition for sf:replace effects
    if #available(iOS 17.0, tvOS 17.0, *), let effect = transition?.effect, effect.isSFReplaceEffect {
      applyReplaceTransition(image: templateImage, effect: effect)
    } else {
      sdImageView.image = templateImage
    }

    // Apply symbol effect if autoplay is enabled
    if #available(iOS 17.0, tvOS 17.0, *), autoplay {
      applySymbolEffect()
    }
    #else
    // SF Symbol content transitions and effects require macOS 14+; for v1 on macOS we set the
    // image directly and skip replace transitions and symbol effects (sf:replace, .bounce, .pulse,
    // etc.). `SDAnimatedImageView`'s macOS rendering writes CGImages straight to `layer.contents`,
    // bypassing `contentTintColor`, so when a tint is requested we composite it into the bitmap
    // here instead. See `tintedImage(_:with:)`.
    if let imageTintColor {
      sdImageView.image = tintedImage(templateImage, with: imageTintColor)
    } else {
      sdImageView.image = templateImage
    }
    applyImageTint(nil)
    #endif

    onDisplay()
  }

  private func maybeRenderLocalAsset(from source: ImageSource) -> Bool {
    if let local = localAssetImage(from: source) {
      // `UIImage(named:)` serves bundled assets from the system's in-memory cache, so report a
      // memory hit — this lets `transition.skipOnCacheHit` treat them as instantly available.
      renderSourceImage(local, cacheType: .memory)
      return true
    }

    return false
  }

  private func localAssetImage(from source: ImageSource) -> UIImage? {
    guard let path = localAssetName(from: source.uri) else {
      return nil
    }
    return UIImage(named: path)
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

    // Asset catalog (xcassets) images aren't resolvable by SDWebImage, so try the
    // local lookup first — mirroring the proper source path in `maybeRenderLocalAsset`.
    if let localImage = localAssetImage(from: placeholder) {
      placeholderImage = localImage
      displayPlaceholderIfNecessary()
      return
    }

    // Cache placeholders on the disk. Should we let the user choose whether
    // to cache them or apply the same policy as with the proper image?
    // Basically they are also cached in memory as the `placeholderImage` property,
    // so just `disk` policy sounds like a good idea.
    let context = createBaseImageContext(source: placeholder, cachePolicy: .disk)

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
      // Module-qualify the call because `NSView` ships an instance method named `resize` on macOS,
      // which otherwise wins overload resolution over the module-level `resize(image:toSize:scale:)`.
      return ExpoImage.resize(image: image, toSize: idealSize, scale: scale)
    }
    return image
  }

  // MARK: - Rendering

  /**
   Moves the layer on which the image is rendered to respect the `contentPosition` prop.
   */
  private func applyContentPosition(contentSize: CGSize, containerSize: CGSize) {
    let offset = contentPosition.offset(contentSize: contentSize, containerSize: containerSize)
    // `NSView.layer` is optional on macOS, but `UIView.layer` is non-optional on iOS/tvOS.
    #if os(macOS)
    guard let imageLayer = sdImageView.layer else {
      return
    }
    #else
    let imageLayer = sdImageView.layer
    #endif
    if imageLayer.mask != nil {
      // In New Architecture mode, React Native adds a mask layer to image subviews.
      // When moving the layer frame, we must move the mask layer with a compensation value.
      // This prevents the layer from being cropped.
      // See https://github.com/expo/expo/issues/34201
      // and https://github.com/facebook/react-native/blob/c72d4c5ee97/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm#L1066-L1076
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      imageLayer.frame.origin = offset
      imageLayer.mask?.frame.origin = CGPoint(x: -offset.x, y: -offset.y)
      CATransaction.commit()
    } else {
      imageLayer.frame.origin = offset
    }
  }

  internal func renderSourceImage(_ image: UIImage?, cacheType: ImageCacheType = .none) {
    let isInitialDisplay = sourceImage == nil

    // Update the source image before it gets rendered or transitioned to.
    sourceImage = image

    #if !os(macOS)
    // For SF Symbol replace effect, skip the UIView transition and let the native symbol animation handle it
    let isSFReplaceEffect = transition?.effect.isSFReplaceEffect == true && isSFSymbolSource

    if let transition = transition, transition.duration > 0, !isSFReplaceEffect,
      transition.shouldPlay(forCacheType: cacheType, isInitialDisplay: isInitialDisplay) {
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
    #else
    // macOS doesn't get UIView-style cross-fade transitions in v1 — set the image directly.
    setImage(image, contentFit: contentFit, isPlaceholder: false)
    #endif
  }

  private func setImage(_ image: UIImage?, contentFit: ContentFit, isPlaceholder: Bool) {
    applyContentFit(contentFit)

    if isPlaceholder {
      sdImageView.autoPlayAnimatedImage = true
    } else {
      sdImageView.autoPlayAnimatedImage = autoplay
    }

    #if !os(macOS)
    // Remove any existing symbol effects before setting new image
    if #available(iOS 17.0, tvOS 17.0, *) {
      sdImageView.removeAllSymbolEffects()
    }
    #endif

    if let imageTintColor, !isPlaceholder {
      let templateImage = image.map { makeTemplateImage(from: $0) }
      #if !os(macOS)
      applyImageTint(imageTintColor)
      // Use replace content transition for SF Symbols when sf:replace effect is set
      if #available(iOS 17.0, tvOS 17.0, *), isSFSymbolSource, let effect = transition?.effect, effect.isSFReplaceEffect, let templateImage {
        let duration = (transition?.duration ?? 300) / 1000
        applyReplaceTransition(image: templateImage, effect: effect, duration: duration)
      } else {
        sdImageView.image = templateImage
      }
      #else
      // On macOS the layer-backed rendering ignores `contentTintColor`; bake the tint into the
      // bitmap instead. See `tintedImage(_:with:)` for the why.
      if let templateImage {
        sdImageView.image = tintedImage(templateImage, with: imageTintColor)
      } else {
        sdImageView.image = nil
      }
      applyImageTint(nil)
      #endif
    } else {
      #if !os(macOS)
      applyImageTint(nil)
      // Use replace content transition for SF Symbols when sf:replace effect is set
      if #available(iOS 17.0, tvOS 17.0, *), isSFSymbolSource, let effect = transition?.effect, effect.isSFReplaceEffect, let image {
        let duration = (transition?.duration ?? 300) / 1000
        applyReplaceTransition(image: image, effect: effect, duration: duration)
      } else {
        sdImageView.image = image
      }
      #else
      sdImageView.image = image
      applyImageTint(nil)
      #endif
    }

    #if !os(macOS)
    // Apply symbol effect if this is an SF Symbol and autoplay is enabled
    if #available(iOS 17.0, tvOS 17.0, *) {
      if !isPlaceholder && isSFSymbolSource && autoplay {
        applySymbolEffect()
      }
    }
    #endif

    if !isPlaceholder {
      onDisplay()
    }

#if !os(tvOS) && !os(macOS)
    if enableLiveTextInteraction {
      analyzeImage()
    }
#endif
  }

  // MARK: - Symbol Effects
  // SF Symbol effects rely on UIImageView's `addSymbolEffect`/`setSymbolImage` extensions and
  // require macOS 14+. For the v1 macOS port the symbol-effects machinery is gated out; symbols
  // still render and tint, just without animated effects (.bounce, .pulse, sf:replace, etc.).
  #if !os(macOS)

  @available(iOS 17.0, tvOS 17.0, *)
  func applySymbolEffect() {
    // Remove any existing effects before applying new ones
    sdImageView.removeAllSymbolEffects()

    guard let effects = sfEffect, !effects.isEmpty else {
      return
    }

    for sfEffectItem in effects {
      applySingleSymbolEffect(sfEffectItem)
    }
  }

  @available(iOS 17.0, tvOS 17.0, *)
  private func applySingleSymbolEffect(_ sfEffectItem: SFSymbolEffect) {
    let repeatCount = sfEffectItem.repeatCount
    // -1 = infinite, 0 = play once, 1 = repeat once (play twice), etc.
    let options: SymbolEffectOptions = repeatCount < 0 ? .repeating : .repeat(repeatCount + 1)
    let scope = sfEffectItem.scope
    let effect = sfEffectItem.effect

    switch effect {
    case .bounce, .bounceUp, .bounceDown:
      let base: BounceSymbolEffect = effect == .bounceUp ? .bounce.up : effect == .bounceDown ? .bounce.down : .bounce
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(base.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(base.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(base, options: options)
      }
    case .pulse:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.pulse.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.pulse.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.pulse, options: options)
      }
    case .variableColor, .variableColorIterative, .variableColorCumulative:
      let base: VariableColorSymbolEffect = effect == .variableColorIterative ? .variableColor.iterative :
        effect == .variableColorCumulative ? .variableColor.cumulative : .variableColor
      sdImageView.addSymbolEffect(base, options: options)
    case .scale, .scaleUp, .scaleDown:
      let base: ScaleSymbolEffect = effect == .scaleUp ? .scale.up : effect == .scaleDown ? .scale.down : .scale
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(base.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(base.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(base, options: options)
      }
    case .appear:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.appear.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.appear.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.appear, options: options)
      }
    case .disappear:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.disappear.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.disappear.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.disappear, options: options)
      }
    default:
      if #available(iOS 18.0, tvOS 18.0, *) {
        applySymbolEffectiOS18(effect: effect, scope: scope, options: options)
      }
    }
  }

  @available(iOS 18.0, tvOS 18.0, *)
  private func applySymbolEffectiOS18(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {
    switch effect {
    case .wiggle:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.wiggle.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.wiggle.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.wiggle, options: options)
      }
    case .rotate:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.rotate.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.rotate.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.rotate, options: options)
      }
    case .breathe:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.breathe.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.breathe.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.breathe, options: options)
      }
    default:
      if #available(iOS 26.0, tvOS 26.0, *) {
        applySymbolEffectiOS26(effect: effect, scope: scope, options: options)
      }
    }
  }

  @available(iOS 26.0, tvOS 26.0, *)
  private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {
    switch effect {
    case .drawOn:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOn.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOn.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOn, options: options)
      }
    case .drawOff:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOff.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOff.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOff, options: options)
      }
    default:
      break
    }
  }

  func startSymbolAnimation() {
    if #available(iOS 17.0, tvOS 17.0, *) {
      applySymbolEffect()
    }
  }

  func stopSymbolAnimation() {
    if #available(iOS 17.0, tvOS 17.0, *) {
      sdImageView.removeAllSymbolEffects()
    }
  }

  @available(iOS 17.0, tvOS 17.0, *)
  func applyReplaceTransition(image: UIImage, effect: ImageTransitionEffect, duration: Double = 0) {
    let animate: (@escaping () -> Void) -> Void = { block in
      if duration > 0 {
        UIView.animate(withDuration: duration, animations: block)
      } else {
        block()
      }
    }

    switch effect {
    case .sfDownUp:
      animate { self.sdImageView.setSymbolImage(image, contentTransition: .replace.downUp) }
    case .sfUpUp:
      animate { self.sdImageView.setSymbolImage(image, contentTransition: .replace.upUp) }
    case .sfOffUp:
      animate { self.sdImageView.setSymbolImage(image, contentTransition: .replace.offUp) }
    default:
      animate { self.sdImageView.setSymbolImage(image, contentTransition: .replace) }
    }
  }

  #else
  // No-op stubs on macOS so callers (e.g. `startAnimating` / `stopAnimating` async functions in
  // `ImageModule`) keep a consistent surface across platforms.
  func startSymbolAnimation() {}
  func stopSymbolAnimation() {}
  #endif // !os(macOS)

  // MARK: - Helpers

  #if os(macOS)
  // `NSImage.SymbolWeight` does not exist; macOS configures symbol weight via `NSFont.Weight`.
  private func parseSymbolWeight(_ fontWeight: String?) -> NSFont.Weight {
    switch fontWeight {
    case "100": return .ultraLight
    case "200": return .thin
    case "300": return .light
    case "400", "normal": return .regular
    case "500": return .medium
    case "600": return .semibold
    case "700", "bold": return .bold
    case "800": return .heavy
    case "900": return .black
    default: return .regular
    }
  }
  #else
  private func parseSymbolWeight(_ fontWeight: String?) -> UIImage.SymbolWeight {
    switch fontWeight {
    case "100": return .ultraLight
    case "200": return .thin
    case "300": return .light
    case "400", "normal": return .regular
    case "500": return .medium
    case "600": return .semibold
    case "700", "bold": return .bold
    case "800": return .heavy
    case "900": return .black
    default: return .regular
    }
  }
  #endif

  func cancelPendingOperation() {
    pendingOperation?.cancel()
    pendingOperation = nil
    pendingSVGVariablesTask?.cancel()
    pendingSVGVariablesTask = nil
  }

  /**
   A scale of the screen where the view is presented,
   or the main scale if the view is not mounted yet.
   */
  var screenScale: Double {
    return displayScale
  }

  /**
   Cross-platform display scale (UIScreen on iOS/tvOS, backingScaleFactor on macOS).
   */
  var displayScale: Double {
    #if os(macOS)
    return Double(window?.backingScaleFactor ?? NSScreen.main?.backingScaleFactor ?? 1)
    #else
    return window?.screen.scale as? Double ?? UIScreen.main.scale
    #endif
  }

  // MARK: - Platform Bridges

  /**
   Applies the given content fit to the underlying image view using the right platform property.
   */
  private func applyContentFit(_ fit: ContentFit) {
    #if os(macOS)
    sdImageView.imageScaling = fit.toImageScaling()
    #else
    sdImageView.contentMode = fit.toContentMode()
    #endif
  }

  /**
   Applies the given tint color to the underlying image view using the right platform property.
   When `color` is nil, the tint is cleared.
   */
  private func applyImageTint(_ color: UIColor?) {
    #if os(macOS)
    sdImageView.contentTintColor = color
    #else
    sdImageView.tintColor = color
    #endif
  }

  /**
   Returns a template-rendering version of the image so it can be tinted by the hosting view.
   */
  private func makeTemplateImage(from image: UIImage) -> UIImage {
    #if os(macOS)
    image.isTemplate = true
    return image
    #else
    return image.withRenderingMode(.alwaysTemplate)
    #endif
  }

  /**
   Cross-platform SF Symbol image creation. `UIImage(systemName:withConfiguration:)` doesn't exist
   on `NSImage`; macOS uses `init(systemSymbolName:accessibilityDescription:)` plus
   `withSymbolConfiguration(_:)`.
   */
  private func systemSymbolImage(named name: String, configuration: UIImage.SymbolConfiguration) -> UIImage? {
    #if os(macOS)
    guard let image = NSImage(systemSymbolName: name, accessibilityDescription: nil) else {
      return nil
    }
    return image.withSymbolConfiguration(configuration) ?? image
    #else
    return UIImage(systemName: name, withConfiguration: configuration)
    #endif
  }

  #if os(macOS)
  /**
   Bakes a tint color into a template image. `SDAnimatedImageView`'s macOS `setImage:` unconditionally
   routes through a `CALayerDelegate` `displayLayer:` that writes the CGImage straight to
   `layer.contents`, bypassing `NSImageView.contentTintColor`. We work around that by rendering a
   new image where the tint is composited onto the template alpha (source-in), then ship the result
   as a non-template raster so the layer-based path renders it as-is.
   */
  private func tintedImage(_ image: NSImage, with color: NSColor) -> NSImage {
    let size = image.size
    guard size.width > 0, size.height > 0 else {
      return image
    }
    let tinted = NSImage(size: size, flipped: false) { rect in
      image.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1.0)
      color.set()
      rect.fill(using: .sourceAtop)
      return true
    }
    tinted.isTemplate = false
    return tinted
  }
  #endif

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

  /**
   Creates a base SDWebImageContext for this view. It should include options that are shared by both placeholders and final images.
   */
  private func createBaseImageContext(source: ImageSource, cachePolicy: ImageCachePolicy? = nil) -> SDWebImageContext {
    var context = createSDWebImageContext(
      forSource: source,
      cachePolicy: cachePolicy ?? self.cachePolicy,
      useAppleWebpCodec: useAppleWebpCodec
    )

    // Decode to HDR if the `preferHighDynamicRange` prop is on (in this case `preferredImageDynamicRange` is set to high).
    #if !os(macOS)
    if #available(iOS 17.0, macCatalyst 17.0, tvOS 17.0, *) {
      context[.imageDecodeToHDR] = sdImageView.preferredImageDynamicRange == .constrainedHigh || sdImageView.preferredImageDynamicRange == .high
    }
    #endif

    // Some loaders (e.g. PhotoLibraryAssetLoader) may need to know the screen scale.
    context[ImageView.screenScaleKey] = screenScale

    return context
  }

  // MARK: - Live Text Interaction
#if !os(tvOS) && !os(macOS)
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

func localAssetName(from url: URL?) -> String? {
  guard let url else {
    return nil
  }

  // `ExpoModulesCore` converts scheme-less URI strings from JS via
  // `URL(fileURLWithPath:)`, so asset names like "my_image" arrive here with
  // `scheme == "file"`. Accept those alongside truly scheme-less URLs; reject
  // remote/SF Symbol/blurhash/etc. schemes.
  if let scheme = url.scheme, scheme != "file" {
    return nil
  }

  // Use `relativePath` so we recover the original input ("my_image") instead of
  // the absolute path it resolves to against the file:// base
  var path = url.relativePath
  if path.hasPrefix("/") {
    path.removeFirst()
  }
  return path.isEmpty ? nil : path
}

/// Carries a freshly decoded image from the parsing task back to the main actor. Unchecked because
/// `UIImage` isn't `Sendable`; the image is never touched again from the parsing side.
private struct SubstitutedSVG: @unchecked Sendable {
  let image: UIImage?
}
