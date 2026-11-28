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

  private let imageView = SDAnimatedImageView(frame: .zero)

  /// `nonisolated(unsafe)` so that `deinit` can cancel it. It's otherwise read and written only on the main thread.
  nonisolated(unsafe) private var operation: SDWebImageCombinedOperation?

  /// Increases with each load. A completion of an older load is ignored.
  private var loadGeneration = 0

  /// The inputs of the running or finished load.
  private var currentLoadKey: ImageView2LoadKey?

  /// The image ref that the view displays, when the source is an image ref.
  private var currentImageRef: SharedRef<UIImage>?

  /// The image that the view displays.
  private var image: UIImage?

  /// The size of the last layout, to pick the source again when the size changes.
  private var laidOutSize: CGSize = .zero

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
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    if bounds.size != laidOutSize {
      laidOutSize = bounds.size
      // A new size can change the best source. The load restarts only when the source changes.
      loadIfNeeded()
    }
    layoutImageView()
  }

  // MARK: - Loading

  private var screenScale: Double {
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

  private func startLoad(source: ImageSource, uri: URL) {
    operation?.cancel()
    loadGeneration += 1
    currentImageRef = nil

    let generation = loadGeneration
    let context = createSDWebImageContext(forSource: source, cachePolicy: props.cachePolicy)
    let isPhotoLibraryAsset = source.isPhotoLibraryAsset
    // Event props can be called from any thread, and the progress block runs on a background queue.
    nonisolated(unsafe) let onProgress = props.onProgress

    props.onLoadStart()

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
        onProgress(ImageView2ProgressEvent(
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
            url: url
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
    url: URL?
  ) {
    guard generation == loadGeneration else {
      return
    }
    if let error {
      operation = nil
      let nsError = error as NSError

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
    display(image, cacheType: ImageCacheType.fromSdCacheType(cacheType))
  }

  private func display(_ image: UIImage, cacheType: ImageCacheType) {
    let isInitialDisplay = self.image == nil
    self.image = image
    imageView.autoPlayAnimatedImage = props.autoplay

    if let transition = props.transition,
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
    props.onDisplay()
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
    loadGeneration += 1
    currentLoadKey = nil
    currentImageRef = nil
    image = nil
    imageView.image = nil
  }

  // MARK: - Layout

  private func layoutImageView() {
    guard let image else {
      imageView.frame = clippingView.bounds
      return
    }
    imageView.frame = imageView2Frame(
      imageSize: image.size,
      containerSize: bounds.size,
      contentFit: props.contentFit,
      contentPosition: props.contentPosition
    ) ?? clippingView.bounds
  }
}

// MARK: - Helpers

/// The frame of the image in a container of the given size, as the CSS `object-fit` and `object-position`
/// properties place it. `imageSize` is in points. Returns `nil` when a size is empty or the frame isn't finite.
func imageView2Frame(
  imageSize: CGSize,
  containerSize: CGSize,
  contentFit: ContentFit,
  contentPosition: ImageView2ContentPosition?
) -> CGRect? {
  guard imageSize.width > 0, imageSize.height > 0, containerSize.width > 0, containerSize.height > 0 else {
    return nil
  }
  let size: CGSize

  switch contentFit {
  case .contain:
    size = imageSize * min(containerSize.width / imageSize.width, containerSize.height / imageSize.height)
  case .cover:
    size = imageSize * max(containerSize.width / imageSize.width, containerSize.height / imageSize.height)
  case .fill:
    size = containerSize
  case .none:
    size = imageSize
  case .scaleDown:
    if imageSize.width > containerSize.width || imageSize.height > containerSize.height {
      size = imageSize * min(containerSize.width / imageSize.width, containerSize.height / imageSize.height)
    } else {
      size = imageSize
    }
  }
  guard size.width.isFinite, size.height.isFinite else {
    return nil
  }
  let freeSpace = CGSize(width: containerSize.width - size.width, height: containerSize.height - size.height)
  let position = contentPosition ?? ImageView2ContentPosition()
  let origin = CGPoint(
    x: positionOrigin(start: position.left, end: position.right, freeSpace: freeSpace.width),
    y: positionOrigin(start: position.top, end: position.bottom, freeSpace: freeSpace.height)
  )
  guard origin.x.isFinite, origin.y.isFinite else {
    return nil
  }
  return CGRect(origin: origin, size: size)
}

/// The origin on one axis. A distance from the start edge wins over one from the end edge, and a distance
/// in points wins over a percentage. Without a value, the image is centered.
private func positionOrigin(
  start: ImageView2PositionValue?,
  end: ImageView2PositionValue?,
  freeSpace: Double
) -> Double {
  if let distance = positionDistance(start) {
    return distance
  }
  if let distance = positionDistance(end) {
    return freeSpace - distance
  }
  if let factor = positionFactor(start) {
    return freeSpace * factor
  }
  if let factor = positionFactor(end) {
    return freeSpace * (1 - factor)
  }
  return freeSpace / 2
}

/// A distance in points: a number, or a string with only a number. A value that isn't finite counts as no value.
private func positionDistance(_ value: ImageView2PositionValue?) -> Double? {
  let distance: Double?

  switch value {
  case .number(let number):
    distance = number
  case .string(let string):
    distance = Double(string)
  case nil:
    distance = nil
  }
  return distance?.isFinite == true ? distance : nil
}

/// A fraction of the free space: a percentage string such as `"25%"`, or `"center"` for 50%.
private func positionFactor(_ value: ImageView2PositionValue?) -> Double? {
  guard case .string(let string) = value else {
    return nil
  }
  if string == "center" {
    return 0.5
  }
  guard string.contains("%"), let percentage = Double(string.replacingOccurrences(of: "%", with: "")),
    percentage.isFinite else {
    return nil
  }
  return percentage / 100
}
