// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

@ExpoModule("ExpoFontUtils")
public final class FontUtilsModule: Module {
  // The macros skip members inside `#if`, so the function exists on every platform.
  @JS(.concurrent)
  func renderToImageAsync(glyphs: String, options: RenderToImageOptions) async throws -> RenderToImageResult {
#if os(macOS)
    throw RenderToImageUnavailableException()
#else
    let font = if let fontName = UIFont.fontNames(forFamilyName: options.fontFamily).first,
      let uiFont = UIFont(name: fontName, size: options.size) {
      uiFont
    } else {
      UIFont.systemFont(ofSize: options.size)
    }

    var attributes: [NSAttributedString.Key: Any] = [
      .font: font,
      .foregroundColor: UIColor(options.color)
    ]

    if let lineHeight = options.lineHeight {
      let paragraphStyle = NSMutableParagraphStyle()
      paragraphStyle.minimumLineHeight = lineHeight
      paragraphStyle.maximumLineHeight = lineHeight
      attributes[.paragraphStyle] = paragraphStyle
      // Adding baseline offset to vertically center the text within the specified line height
      attributes[.baselineOffset] = (lineHeight - font.lineHeight) / 2
    }

    let attributedString = NSAttributedString(
      string: glyphs,
      attributes: attributes
    )

    let renderer = UIGraphicsImageRenderer(size: attributedString.size())
    let image = renderer.image { _ in
      attributedString.draw(at: .zero)
    }

    guard let data = image.pngData() else {
      throw CreateImageException()
    }

    let outputURL = URL(fileURLWithPath: "\(NSTemporaryDirectory())\(UUID().uuidString).png")

    do {
      try data.write(to: outputURL, options: .atomic)
    } catch {
      throw SaveImageException(outputURL.absoluteString)
    }
    return RenderToImageResult(
      uri: outputURL.absoluteString,
      width: image.size.width,
      height: image.size.height,
      scale: image.scale
    )
#endif
  }
}
