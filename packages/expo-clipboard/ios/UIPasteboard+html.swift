// Copyright 2018-present 650 Industries. All rights reserved.
#if canImport(UIKit)
import UIKit
import MobileCoreServices
#elseif canImport(AppKit)
import AppKit
#endif

import UniformTypeIdentifiers

extension UIPasteboard {
  var html: String? {
    get {
      #if os(iOS)
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
      #else
      if let htmlString = self.string(forType: .html) {
        return htmlString
      }
      
      if let rtfData = self.data(forType: .rtf) {
        let attributedString = try? NSAttributedString(data: rtfData,
                                                       options: [
                                                        .documentType: NSAttributedString.DocumentType.rtf
                                                       ],
                                                       documentAttributes: nil)
        
        if let htmlString = attributedString?.htmlString {
          return htmlString
        }
      }
      #endif
      return nil
    }
    set {
      guard let newString = newValue,
            let attributedString = try? NSAttributedString(htmlString: newString)
      else {
      #if os(iOS)
        self.string = ""
      #else
        self.clearContents()
      #endif
        return
      }
      
      #if os(iOS)
      let item: [String: Any] = [
        UTType.rtf.identifier: attributedString.rtfData as Any,
        UTType.html.identifier: attributedString.htmlString as Any,
        UTType.utf8PlainText.identifier: attributedString.string
      ]
      self.setItems([item])
      #else
      self.setString(attributedString.htmlString ?? "", forType: .html)
      #endif
      
    }
  }

  var hasHTML: Bool {
#if os(iOS)
    return contains(pasteboardTypes: [UTType.html.identifier, UTType.rtf.identifier])
#else
    self.canReadItem(withDataConformingToTypes: [NSPasteboard.PasteboardType.html.rawValue, NSPasteboard.PasteboardType.rtf.rawValue])
#endif
  }
}
