// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore

// MARK: - Frame

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

// MARK: - Downscaling

/// The size that a displayed image was downscaled to, and the content fit that the size was computed for.
struct ImageView2Downscaling: Equatable {
  let size: CGSize
  let contentFit: ContentFit
}

/// The size in points to downscale an image to, so that it has no more pixels than the view shows, or `nil` when the
/// image doesn't have more pixels than that in both dimensions. The current view uses the same rule.
func imageView2DownscaleSize(
  imageSize: CGSize,
  imageScale: Double,
  containerSize: CGSize,
  screenScale: Double,
  contentFit: ContentFit
) -> CGSize? {
  guard let frame = imageView2Frame(
    imageSize: imageSize,
    containerSize: containerSize,
    contentFit: contentFit,
    contentPosition: nil
  ) else {
    return nil
  }
  // Rounding to the nearest pixel, not up to a whole point, keeps the aspect ratio of the image within half a pixel.
  let roundedPixelSize = (frame.size * screenScale).rounded(.toNearestOrAwayFromZero)
  let targetPixelSize = CGSize(width: max(roundedPixelSize.width, 1), height: max(roundedPixelSize.height, 1))
  let pixelSize = imageSize * imageScale

  guard pixelSize.width > targetPixelSize.width, pixelSize.height > targetPixelSize.height else {
    return nil
  }
  return targetPixelSize / screenScale
}

/// Whether the view needs the image decoded again: when it displays a downscaled image and now needs more pixels or
/// the whole image, or when the image was stretched for `fill` and the content fit isn't `fill` anymore.
func imageView2NeedsRedecode(current: ImageView2Downscaling?, targetSize: CGSize?, contentFit: ContentFit) -> Bool {
  guard let current else {
    // The view displays the image as it was loaded, with all of its pixels.
    return false
  }
  guard let targetSize else {
    return true
  }
  if current.contentFit == .fill && contentFit != .fill {
    return true
  }
  // A point of tolerance, so that rounding doesn't decode the image again.
  return targetSize.width > current.size.width + 1 || targetSize.height > current.size.height + 1
}
