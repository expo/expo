// Copyright 2018-present 650 Industries. All rights reserved.

#if !os(macOS)
import UIKit
import MobileCoreServices
import UniformTypeIdentifiers

extension UIPasteboard {
  var html: String? {
    get {
      if let htmlString = self.value(forPasteboardType: UTType.html.identifier) as? String {
        return htmlString
      }

      if let rtfData = self.data(forPasteboardType: UTType.rtf.identifier as String) {
        let attributedString = try? NSAttributedString(data: rtfData,
                                                       options: [
                                                         .documentType: NSAttributedString.DocumentType.rtf
                                                       ],
                                                       documentAttributes: nil)

        if let htmlString = attributedString?.htmlString {
          return htmlString
        }
      }

      return self.string
    }
    set {
      guard let item = UIPasteboard.htmlItem(newValue) else {
        self.string = ""
        return
      }

      self.setItems([item])
    }
  }

  /// The rich text, HTML and plain text representations of an HTML string.
  static func htmlItem(_ html: String?) -> [String: Any]? {
    guard let html, let attributedString = try? NSAttributedString(htmlString: html) else {
      return nil
    }
    return [
      UTType.rtf.identifier: attributedString.rtfData as Any,
      UTType.html.identifier: attributedString.htmlString as Any,
      UTType.utf8PlainText.identifier: attributedString.string
    ]
  }

  var hasHTML: Bool {
    contains(pasteboardTypes: [UTType.html.identifier, UTType.rtf.identifier])
  }
}
#endif
