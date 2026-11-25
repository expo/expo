// Copyright 2026-present 650 Industries. All rights reserved.

#if os(macOS)
import ExpoModulesCore

extension UIImage {
  func pngData() -> Data? {
    guard let tiff = self.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff) else {
      return nil
    }
    return bitmap.representation(using: .png, properties: [:])
  }

  func jpegData(compressionQuality: Double) -> Data? {
    guard let tiff = self.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff) else {
      return nil
    }
    return bitmap.representation(
      using: .jpeg,
      properties: [.compressionFactor: NSNumber(value: compressionQuality)]
    )
  }
}

extension UIPasteboard {
  var url: URL? {
    get {
      // swiftlint:disable:next legacy_objc_type
      let urls = self.readObjects(forClasses: [NSURL.self], options: nil) as? [URL]
      return urls?.first
    }
    set {
      self.clearContents()
      guard let url = newValue else {
        return
      }
      // swiftlint:disable:next legacy_objc_type
      self.writeObjects([url as NSURL])
    }
  }

  var html: String? {
    get {
      if let htmlString = self.string(forType: .html) {
        return htmlString
      }

      if let rtfData = self.data(forType: .rtf) {
        let attributedString = try? NSAttributedString(
          data: rtfData,
          options: [.documentType: NSAttributedString.DocumentType.rtf],
          documentAttributes: nil
        )

        if let htmlString = attributedString?.htmlString {
          return htmlString
        }
      }

      return self.string(forType: .string)
    }
    set {
      self.clearContents()
      guard
        let newString = newValue,
        let attributedString = try? NSAttributedString(htmlString: newString)
      else {
        self.setString("", forType: .string)
        return
      }

      if let rtfData = attributedString.rtfData {
        self.setData(rtfData, forType: .rtf)
      }
      if let htmlString = attributedString.htmlString {
        self.setString(htmlString, forType: .html)
      }
      self.setString(attributedString.string, forType: .string)
    }
  }

  var hasStrings: Bool {
    self.canReadItem(withDataConformingToTypes: [NSPasteboard.PasteboardType.string.rawValue])
  }

  var hasURLs: Bool {
    self.canReadItem(withDataConformingToTypes: [NSPasteboard.PasteboardType.URL.rawValue])
  }

  var hasHTML: Bool {
    self.canReadItem(withDataConformingToTypes: [
      NSPasteboard.PasteboardType.html.rawValue,
      NSPasteboard.PasteboardType.rtf.rawValue
    ])
  }

  var hasImages: Bool {
    self.canReadObject(forClasses: [NSImage.self], options: nil)
  }

  var image: NSImage? {
    get {
      let images = self.readObjects(forClasses: [NSImage.self], options: nil) as? [NSImage]
      return images?.first
    }
    set {
      self.clearContents()
      guard let image = newValue else {
        return
      }
      self.writeObjects([image])
    }
  }
}
#endif
