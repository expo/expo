// Copyright 2018-present 650 Industries. All rights reserved.

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
      guard let newString = newValue,
            let attributedString = try? NSAttributedString(htmlString: newString)
      else {
        self.string = ""
        return
      }
      let item: [String: Any] = [
        UTType.rtf.identifier: attributedString.rtfData as Any,
        UTType.html.identifier: attributedString.htmlString as Any,
        UTType.utf8PlainText.identifier: attributedString.string
      ]

      self.setItems([item])
    }
  }

  var hasHTML: Bool {
    contains(pasteboardTypes: [UTType.html.identifier, UTType.rtf.identifier])
  }
}
