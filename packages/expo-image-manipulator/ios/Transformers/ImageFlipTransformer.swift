// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Transformer that creates a new image by flipping given image vertically or horizontally.
 */
internal struct ImageFlipTransformer: ImageTransformer {
  let flip: FlipType

  @MainActor
  func transform(image: UIImage) async -> UIImage {
    let imageView = UIImageView(image: image)

    return drawInNewContext(size: imageView.frame.size) { context in
      switch flip {
      case .vertical:
        let transform = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: imageView.frame.size.height)
        context.cgContext.concatenate(transform)
      case .horizontal:
        let transform = CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: imageView.frame.size.width, ty: 0)
        context.cgContext.concatenate(transform)
      }
      imageView.layer.render(in: context.cgContext)
    }
  }
}
