// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
internal import SDWebImage

// MARK: - Downscaling

extension ImageView2 {
  /// The size in points to downscale an image of the given size and scale to, for the current layout and props.
  func downscaleSize(imageSize: CGSize, imageScale: Double) -> CGSize? {
    guard props.allowDownscaling else {
      return nil
    }
    return imageView2DownscaleSize(
      imageSize: imageSize,
      imageScale: imageScale,
      containerSize: bounds.size,
      screenScale: screenScale,
      contentFit: props.contentFit
    )
  }

  /// Displays a loaded image, downscaled when it has more pixels than the view shows.
  func present(_ loadedImage: UIImage, cacheType: ImageCacheType, isRedecode: Bool) {
    loadedImageSize = loadedImage.size
    loadedImageScale = loadedImage.scale
    let layoutSize = loadedImage.size

    if loadedImage.sd_isAnimated {
      // Like the current view, an animated image is downscaled frame by frame while it plays.
      updateAnimationDownscaling(for: loadedImage)
      display(loadedImage, layoutSize: layoutSize, cacheType: cacheType, isRedecode: isRedecode)
      return
    }
    imageView.animationTransformer = nil

    guard let targetSize = downscaleSize(imageSize: loadedImage.size, imageScale: loadedImage.scale) else {
      downscaling = nil
      display(loadedImage, layoutSize: layoutSize, cacheType: cacheType, isRedecode: isRedecode)
      return
    }
    let generation = loadGeneration
    let downscaling = ImageView2Downscaling(size: targetSize, contentFit: props.contentFit)
    let scale = screenScale
    let loaded = ImageView2ImageBox(image: loadedImage)

    downscaleTask = Task { [weak self] in
      let downscaled = await Task.detached(priority: .userInitiated) {
        return ImageView2ImageBox(image: resize(image: loaded.image, toSize: targetSize, scale: scale))
      }.value

      guard let self, !Task.isCancelled, generation == self.loadGeneration else {
        return
      }
      self.downscaleTask = nil
      self.downscaling = downscaling
      self.display(downscaled.image, layoutSize: layoutSize, cacheType: cacheType, isRedecode: isRedecode)
      // The size of the view can have changed while the image was downscaled.
      self.redecodeIfNeeded()
    }
  }

  /// Sets the transformer that downscales the frames of an animated image for the current size and props.
  private func updateAnimationDownscaling(for image: UIImage) {
    let targetSize = downscaleSize(imageSize: image.size, imageScale: image.scale)
    downscaling = targetSize.map { ImageView2Downscaling(size: $0, contentFit: props.contentFit) }
    imageView.animationTransformer = targetSize.map {
      SDImageResizingTransformer(size: $0 * screenScale, scaleMode: .fill)
    }
  }

  /// Decodes the image again when the displayed image doesn't have enough pixels for the current size and content fit,
  /// or has the wrong aspect ratio for it.
  func redecodeIfNeeded() {
    guard let loadedImageSize, !bounds.isEmpty else {
      return
    }
    let targetSize = downscaleSize(imageSize: loadedImageSize, imageScale: loadedImageScale)

    if imageView2NeedsRedecode(current: downscaling, targetSize: targetSize, contentFit: props.contentFit) {
      redecode()
    }
  }

  /// Decodes the displayed image again for the current size and props, without events. A running load or downscale
  /// already uses the current size and props when it finishes, so it isn't restarted.
  func redecode() {
    guard !isLoading, downscaleTask == nil else {
      return
    }
    if let image, image.sd_isAnimated {
      redecodeAnimatedImage(image)
      return
    }
    guard case .sources(let sources) = props.source,
      let source = getBestSource(from: sources.map { $0.toImageSource() }, forSize: bounds.size, scale: screenScale),
      let uri = source.uri else {
      return
    }
    startLoad(source: source, uri: uri, isRedecode: true)
  }

  /// Downscales the frames of the displayed animated image for the current size and props. The view holds the image
  /// with all of its pixels, so it doesn't load it again.
  private func redecodeAnimatedImage(_ image: UIImage) {
    updateAnimationDownscaling(for: image)

    // `SDAnimatedImageView` reads the transformer only when it creates its player, and it creates no player for the
    // image that it already displays. The new player continues at the frame of the old one. The loop count comes from
    // the player: a seek doesn't update the one of the view.
    let frameIndex = imageView.currentFrameIndex
    let loopCount = imageView.player?.currentLoopCount ?? imageView.currentLoopCount
    imageView.image = nil
    imageView.image = image
    imageView.player?.seekToFrame(at: frameIndex, loopCount: loopCount)
  }
}

/// Carries an image to and from the task that downscales it. Unchecked because `UIImage` isn't `Sendable`; neither
/// side touches the image while the other one uses it.
private struct ImageView2ImageBox: @unchecked Sendable {
  let image: UIImage
}
