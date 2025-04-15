// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class FontUtilsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoFontUtils")

    AsyncFunction("renderToImageAsync") { (glyphs: String, options: RenderToImageOptions, promise: Promise) throws in
      let font: UIFont
      if let fontName = UIFont.fontNames(forFamilyName: options.fontFamily).first,
         let uiFont = UIFont(name: fontName, size: CGFloat(options.size)) {
          font = uiFont
      } else {
          font = UIFont.systemFont(ofSize: CGFloat(options.size))
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

      let outputURL = getOutputURL(glyphs: glyphs, options: options)

      do {
        try data.write(to: outputURL, options: .atomic)
        promise.resolve(outputURL.absoluteString)
      } catch {
        promise.reject(SaveImageException(outputURL.absoluteString))
      }
    }
  }

  private func getOutputURL(glyphs: String, options: RenderToImageOptions) -> URL {
    let glyphCodePoints = glyphs.unicodeScalars.map { String($0.value) }.joined(separator: "")
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    UIColor(options.color).getRed(&r, green: &g, blue: &b, alpha: &a)
    let colorString = String(format: "%02X%02X%02X%02X", Int(r * 255), Int(g * 255), Int(b * 255), Int(a * 255))
    let path = "\(NSTemporaryDirectory())\(options.fontFamily)-\(options.size)-\(colorString)-\(glyphCodePoints).png"
    return URL(fileURLWithPath: path)
  }
}
