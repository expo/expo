// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore
import Symbols
#if !os(tvOS)
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

  var sfEffect: [SFSymbolEffect]?

  var symbolWeight: String?

  var symbolSize: Double?

  var useAppleWebpCodec: Bool = true

  /**
   Tracks whether the current image is an SF Symbol for animation control.
   */
  var isSFSymbolSource: Bool = false

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

    // Track if this is an SF Symbol source for animation handling
    isSFSymbolSource = source.isSFSymbol

    if sdImageView.image == nil {
      sdImageView.contentMode = contentFit.toContentMode()
    }
    var context = createBaseImageContext(source: source)

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
    guard let image = UIImage(systemName: symbolName, withConfiguration: configuration) else {
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

    let scale = window?.screen.scale ?? UIScreen.main.scale
    imageIdealSize = idealSize(
      contentPixelSize: image.size * image.scale,
      containerSize: frame.size,
      scale: scale,
      contentFit: contentFit
    ).rounded(.up)

    applyContentPosition(contentSize: imageIdealSize, containerSize: frame.size)
    renderSFSymbolImage(image)
  }

  private func renderSFSymbolImage(_ image: UIImage) {
    sourceImage = image

    sdImageView.contentMode = contentFit.toContentMode()

    let templateImage = image.withRenderingMode(.alwaysTemplate)
    if let imageTintColor {
      sdImageView.tintColor = imageTintColor
    }

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

    onDisplay()
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

    // For SF Symbol replace effect, skip the UIView transition and let the native symbol animation handle it
    let isSFReplaceEffect = transition?.effect.isSFReplaceEffect == true && isSFSymbolSource

    if let transition = transition, transition.duration > 0, !isSFReplaceEffect {
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

    // Remove any existing symbol effects before setting new image
    if #available(iOS 17.0, tvOS 17.0, *) {
      sdImageView.removeAllSymbolEffects()
    }

    if let imageTintColor, !isPlaceholder {
      sdImageView.tintColor = imageTintColor
      let templateImage = image?.withRenderingMode(.alwaysTemplate)
      // Use replace content transition for SF Symbols when sf:replace effect is set
      if #available(iOS 17.0, tvOS 17.0, *), isSFSymbolSource, let effect = transition?.effect, effect.isSFReplaceEffect, let templateImage {
        let duration = (transition?.duration ?? 300) / 1000
        applyReplaceTransition(image: templateImage, effect: effect, duration: duration)
      } else {
        sdImageView.image = templateImage
      }
    } else {
      sdImageView.tintColor = nil
      // Use replace content transition for SF Symbols when sf:replace effect is set
      if #available(iOS 17.0, tvOS 17.0, *), isSFSymbolSource, let effect = transition?.effect, effect.isSFReplaceEffect, let image {
        let duration = (transition?.duration ?? 300) / 1000
        applyReplaceTransition(image: image, effect: effect, duration: duration)
      } else {
        sdImageView.image = image
      }
    }

    // Apply symbol effect if this is an SF Symbol and autoplay is enabled
    if #available(iOS 17.0, tvOS 17.0, *) {
      if !isPlaceholder && isSFSymbolSource && autoplay {
        applySymbolEffect()
      }
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

  // MARK: - Symbol Effects

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

  // MARK: - Helpers

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
    if #available(iOS 17.0, macCatalyst 17.0, tvOS 17.0, *) {
      context[.imageDecodeToHDR] = sdImageView.preferredImageDynamicRange == .constrainedHigh || sdImageView.preferredImageDynamicRange == .high
    }

    // Some loaders (e.g. PhotoLibraryAssetLoader) may need to know the screen scale.
    context[ImageView.screenScaleKey] = screenScale

    return context
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
