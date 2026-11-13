// Copyright 2026-present 650 Industries. All rights reserved.

import CoreImage
import UIKit

/**
 Covers a view with a blurred snapshot of its content. Used instead of `UIBlurEffect` when
 "Reduce Transparency" is enabled, because iOS then replaces the blur with a translucent tint
 that leaves the content readable. Main thread only.
 */
internal final class BlurredSnapshotView: UIView {
  private static let ciContext = CIContext()
  private static let snapshotScale: CGFloat = 0.25
  private static let maxBlurRadius: CGFloat = 12
  private static let maxTintAlpha: CGFloat = 0.6

  let tintAlpha: CGFloat

  init?(snapshotOf view: UIView, intensity: CGFloat) {
    let intensity = min(max(intensity, 0), 1)
    guard let image = Self.makeBlurredSnapshot(of: view, intensity: intensity) else {
      return nil
    }
    tintAlpha = Self.maxTintAlpha * intensity
    super.init(frame: view.bounds)

    let imageView = UIImageView(image: image)
    imageView.frame = bounds
    imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    imageView.contentMode = .scaleToFill
    addSubview(imageView)

    // Matches the white tint of `UIBlurEffect.Style.light`.
    let tintView = UIView(frame: bounds)
    tintView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    tintView.backgroundColor = UIColor.white.withAlphaComponent(tintAlpha)
    addSubview(tintView)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private static func makeBlurredSnapshot(of view: UIView, intensity: CGFloat) -> UIImage? {
    guard !view.bounds.isEmpty else {
      return nil
    }
    let format = UIGraphicsImageRendererFormat()
    // Rendering at a lower resolution makes the blur cheaper and stronger.
    format.scale = snapshotScale
    let renderer = UIGraphicsImageRenderer(bounds: view.bounds, format: format)
    let snapshot = renderer.image { _ in
      view.drawHierarchy(in: view.bounds, afterScreenUpdates: false)
    }

    guard let input = CIImage(image: snapshot) else {
      return nil
    }
    let blurred = input
      .clampedToExtent()
      .applyingGaussianBlur(sigma: maxBlurRadius * intensity)
      .cropped(to: input.extent)

    guard let cgImage = ciContext.createCGImage(blurred, from: input.extent) else {
      return nil
    }
    return UIImage(cgImage: cgImage)
  }
}
