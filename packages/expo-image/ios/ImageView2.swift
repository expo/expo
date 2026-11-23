// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
internal import SDWebImage

// MARK: - View

/// The image view that is being rewritten on the views of Expo Modules v2. It isn't public API yet:
/// the JS `Image` component renders it only when the internal `experimental_useV2View` prop is set.
@ExpoView<ImageView2Props>("ImageView")
public final class ImageView2: ExpoNativeView {
  /// One manager for all the views, with the cache and the loaders that `ImageView` and the module
  /// functions use, so all of them share one cache.
  private static let imageManager = SDWebImageManager(
    cache: SDImageCache.shared,
    loader: SDImageLoadersManager.shared
  )

  /// Clips the image. React Native masks image views that are direct subviews of a clipping view
  /// with rounded corners to their own bounds, which are not the bounds of this view for most content fits.
  private let clippingView = UIView()

  let imageView = SDAnimatedImageView(frame: .zero)

  /// `nonisolated(unsafe)` so that `deinit` can cancel it. It's otherwise read and written only on the main thread.
  nonisolated(unsafe) var operation: SDWebImageCombinedOperation?

  /// Whether a load runs. `operation` can't tell: a memory cache hit completes the load before `loadImage` returns
  /// the operation.
  private(set) var isLoading = false

  /// Increases with each load. A completion of an older load is ignored.
  private(set) var loadGeneration = 0

  /// The inputs of the running or finished load.
  private var currentLoadKey: ImageView2LoadKey?

  /// The image ref that the view displays, when the source is an image ref.
  private var currentImageRef: SharedRef<UIImage>?

  /// The image that the view displays.
  private(set) var image: UIImage?

  /// The size in points that lays out the displayed image. For a downscaled image, it's the size of the loaded image.
  private var imageLayoutSize: CGSize = .zero

  /// The size of the last layout, to pick the source again when the size changes.
  private var laidOutSize: CGSize = .zero

  /// The size in points and the scale of the image that the last load delivered, before downscaling.
  var loadedImageSize: CGSize?
  var loadedImageScale: Double = 1

  /// What the displayed image was downscaled to, or `nil` when the view displays the image as it was loaded.
  var downscaling: ImageView2Downscaling?

  /// Downscales a loaded image off the main thread.
  var downscaleTask: Task<Void, Never>?

  public override init(frame: CGRect) {
    super.init(frame: frame)

    clipsToBounds = true

    clippingView.frame = bounds
    clippingView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clippingView.clipsToBounds = true

    imageView.contentMode = .scaleToFill
    // Apply trilinear filtering to smooth out mis-sized images.
    imageView.layer.magnificationFilter = .trilinear
    imageView.layer.minificationFilter = .trilinear

    clippingView.addSubview(imageView)
    addSubview(clippingView)
  }

  deinit {
    operation?.cancel()
  }

  public func didUpdateProps(_ diff: ImageView2Props.Diff) {
    // Like the current view, a new recycling key clears the image and loads the source again. Setting the
    // first key doesn't.
    if diff.changed(.recyclingKey), let oldKey = diff.oldValue(\.recyclingKey) ?? nil, oldKey != props.recyclingKey {
      clear()
    }
    if diff.changed([.source, .cachePolicy, .recyclingKey]) {
      loadIfNeeded()
    }
    if diff.changed(.autoplay) {
      applyAutoplay()
    }
    if diff.changed([.contentFit, .contentPosition]) {
      setNeedsLayout()
    }
    if diff.changed(.contentFit) {
      redecodeIfNeeded()
    }
    if diff.changed(.allowDownscaling), !diff.isInitial, loadedImageSize != nil {
      redecode()
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    if bounds.size != laidOutSize {
      laidOutSize = bounds.size
      // A new size can change the best source. The load restarts only when the source changes.
      loadIfNeeded()
      redecodeIfNeeded()
    }
    layoutImageView()
  }

  // MARK: - Loading

  var screenScale: Double {
    // The first load can run before the view is in a window.
    return Double(window?.screen.scale ?? UIScreen.main.scale)
  }

  private func loadIfNeeded() {
    switch props.source {
    case .sources(let sources) where !sources.isEmpty:
      loadBestSource(from: sources.map { $0.toImageSource() })
    case .image(let imageRef):
      displayImageRef(imageRef)
    case .sources, nil:
      clear()
    }
  }

  private func displayImageRef(_ imageRef: SharedRef<UIImage>) {
    if imageRef === currentImageRef {
      return
    }
    clear()
    currentImageRef = imageRef
    // Like the current view, an image ref is displayed without load events.
    display(imageRef.ref, cacheType: .none)
  }

  private func loadBestSource(from sources: [ImageSource]) {
    // There is no best source until the view has a size.
    guard let source = getBestSource(from: sources, forSize: bounds.size, scale: screenScale) else {
      return
    }
    let loadKey = ImageView2LoadKey(source: source, cachePolicy: props.cachePolicy)

    if loadKey == currentLoadKey {
      return
    }
    guard let uri = source.uri else {
      // Cancels the running load, so that its image doesn't show up for this source.
      clear()
      currentLoadKey = loadKey
      props.onLoadStart()
      props.onError(ImageView2ErrorEvent(
        error: "Cannot load the image because its source has no `uri`. The `uri` is probably `undefined` or `null`. "
          + "Pass a URL or a file path as the `uri` of the source."
      ))
      return
    }
    currentLoadKey = loadKey
    startLoad(source: source, uri: uri)
  }

  /// Starts a load. A redecode loads the image of the same source again, at another size, and sends no events.
  func startLoad(source: ImageSource, uri: URL, isRedecode: Bool = false) {
    operation?.cancel()
    downscaleTask?.cancel()
    downscaleTask = nil
    loadGeneration += 1
    currentImageRef = nil

    let generation = loadGeneration
    let context = createSDWebImageContext(forSource: source, cachePolicy: props.cachePolicy)
    let isPhotoLibraryAsset = source.isPhotoLibraryAsset
    // Event props can be called from any thread, and the progress block runs on a background queue.
    nonisolated(unsafe) let onProgress: ((ImageView2ProgressEvent) -> Void)? = isRedecode ? nil : props.onProgress

    if !isRedecode {
      // A redecode loads the current source, so it must not run for the displayed image before this load delivers.
      loadedImageSize = nil
      downscaling = nil
      props.onLoadStart()
    }

    isLoading = true
    operation = Self.imageManager.loadImage(
      with: uri,
      options: [.retryFailed, .handleCookies, .transformAnimatedImage],
      context: context,
      progress: { @Sendable receivedSize, expectedSize, _ in
        // The expected size is unknown (0 or -1) in the first calls.
        guard expectedSize > 0 else {
          return
        }
        // The Photos loader reports the progress as a percentage, without sizes in bytes.
        onProgress?(ImageView2ProgressEvent(
          loaded: isPhotoLibraryAsset ? nil : receivedSize,
          total: isPhotoLibraryAsset ? nil : expectedSize,
          progress: Double(receivedSize) / Double(expectedSize)
        ))
      },
      completed: { @Sendable [weak self] image, _, error, cacheType, finished, url in
        // `SDWebImageManager` calls the completion on the main queue.
        MainActor.assumeIsolated {
          self?.loadCompleted(
            generation: generation,
            image: image,
            error: error,
            cacheType: cacheType,
            finished: finished,
            url: url,
            isRedecode: isRedecode
          )
        }
      }
    )
  }

  // swiftlint:disable:next function_parameter_count
  private func loadCompleted(
    generation: Int,
    image: UIImage?,
    error: Error?,
    cacheType: SDImageCacheType,
    finished: Bool,
    url: URL?,
    isRedecode: Bool
  ) {
    guard generation == loadGeneration else {
      return
    }
    if let error {
      operation = nil
      isLoading = false
      let nsError = error as NSError

      // A failed redecode keeps the displayed image.
      if isRedecode {
        return
      }

      if nsError.domain != SDWebImageErrorDomain || nsError.code != SDWebImageError.cancelled.rawValue {
        props.onError(ImageView2ErrorEvent(error: error.localizedDescription))
      }
      return
    }
    // A degraded image from the Photos library comes with `finished` set to `false`, before the full one.
    guard finished, let image else {
      return
    }
    operation = nil
    isLoading = false

    if isRedecode {
      present(image, cacheType: ImageCacheType.fromSdCacheType(cacheType), isRedecode: true)
      return
    }
    props.onLoad(ImageView2LoadEvent(
      cacheType: cacheTypeToString(cacheType),
      source: ImageView2LoadedSource(
        url: url?.absoluteString,
        width: image.size.width,
        height: image.size.height,
        mediaType: imageFormatToMediaType(image.sd_imageFormat),
        isAnimated: image.sd_isAnimated
      )
    ))
    appContext?.moduleRegistry.getModule(implementing: ImageModule.self)?.emitImageLoaded(
      url: url?.absoluteString ?? "",
      width: image.size.width * image.scale,
      height: image.size.height * image.scale
    )
    present(image, cacheType: ImageCacheType.fromSdCacheType(cacheType), isRedecode: false)
  }

  // MARK: - Display

  /// Displays an image, laid out with `layoutSize` or its own size. A redecode replaces the image without a transition
  /// and without `onDisplay`.
  func display(_ image: UIImage, layoutSize: CGSize? = nil, cacheType: ImageCacheType, isRedecode: Bool = false) {
    let isInitialDisplay = self.image == nil
    self.image = image
    imageLayoutSize = layoutSize ?? image.size
    imageView.autoPlayAnimatedImage = props.autoplay

    if !isRedecode, let transition = props.transition,
      transition.shouldPlay(cacheType: cacheType, isInitialDisplay: isInitialDisplay) {
      // Transitions the clipping view, which keeps its bounds, so the outgoing image keeps its frame.
      UIView.transition(
        with: clippingView,
        duration: transition.duration / 1000,
        options: transition.animationOptions
      ) {
        self.showImage(image)
      }
    } else {
      showImage(image)
    }
    if !isRedecode {
      props.onDisplay()
    }
  }

  private func showImage(_ image: UIImage) {
    imageView.image = image
    layoutImageView()
  }

  private func applyAutoplay() {
    imageView.autoPlayAnimatedImage = props.autoplay

    if props.autoplay {
      imageView.startAnimating()
    } else {
      imageView.stopAnimating()
    }
  }

  private func clear() {
    operation?.cancel()
    operation = nil
    isLoading = false
    downscaleTask?.cancel()
    downscaleTask = nil
    loadGeneration += 1
    currentLoadKey = nil
    currentImageRef = nil
    loadedImageSize = nil
    downscaling = nil
    image = nil
    imageView.animationTransformer = nil
    imageView.image = nil
  }

  // MARK: - Layout

  private func layoutImageView() {
    guard image != nil else {
      imageView.frame = clippingView.bounds
      return
    }
    imageView.frame = imageView2Frame(
      imageSize: imageLayoutSize,
      containerSize: bounds.size,
      contentFit: props.contentFit,
      contentPosition: props.contentPosition
    ) ?? clippingView.bounds
  }
}
