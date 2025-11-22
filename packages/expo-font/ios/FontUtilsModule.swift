// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class FontUtilsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoFontUtils")

#if !os(macOS)
    AsyncFunction("renderToImageAsync") { (glyphs: String, options: RenderToImageOptions, promise: Promise) throws in
      let font = if let fontName = UIFont.fontNames(forFamilyName: options.fontFamily).first,
        let uiFont = UIFont(name: fontName, size: options.size) {
        uiFont
      } else {
        UIFont.systemFont(ofSize: options.size)
      }

      let attributedString = NSAttributedString(
        string: glyphs,
        attributes: [
          .font: font,
          .foregroundColor: UIColor(options.color)
        ]
      )

      let renderer = UIGraphicsImageRenderer(size: attributedString.size())
      let image = renderer.image { _ in
        attributedString.draw(at: .zero)
      }

      guard let data = image.pngData() else {
        promise.reject(CreateImageException())
        return
      }

      let outputURL = URL(fileURLWithPath: "\(NSTemporaryDirectory())\(UUID().uuidString).png")

      do {
        try data.write(to: outputURL, options: .atomic)
        promise.resolve([
          "uri": outputURL.absoluteString,
          "width": image.size.width,
          "height": image.size.height,
          "scale": UIScreen.main.scale
        ])
      } catch {
        promise.reject(SaveImageException(outputURL.absoluteString))
      }
    }
#endif
  }
}
