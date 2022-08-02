// Copyright 2018-present 650 Industries. All rights reserved.

import UIKit
import MobileCoreServices

extension UIPasteboard {
  var html: String? {
    get {
      if let htmlString = self.value(forPasteboardType: kUTTypeHTML as String) as? String {
        return htmlString
      }

      if let rtfData = self.data(forPasteboardType: kUTTypeRTF as String) as? Data {
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
        kUTTypeRTF as String: attributedString.rtfData,
        kUTTypeHTML as String: attributedString.htmlString,
        kUTTypeUTF8PlainText as String: attributedString.string
      ]

      self.setItems([item])
    }
  }

  var hasHTML: Bool {
    contains(pasteboardTypes: [kUTTypeHTML as String, kUTTypeRTF as String])
  }
}
