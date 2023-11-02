// Copyright 2018-present 650 Industries. All rights reserved.

import MobileCoreServices
import UIKit

extension UIPasteboard {
  var html: String? {
    get {
      if let htmlString = value(forPasteboardType: kUTTypeHTML as String) as? String {
        return htmlString
      }
      if let rtfData = data(forPasteboardType: kUTTypeRTF as String) as? Data {
        let attributedString = try? NSAttributedString(data: rtfData,
                                                      options: [.documentType: NSAttributedString.DocumentType.rtf],
                                                       documentAttributes: nil)
        if let htmlString = attributedString?.htmlString {
          return htmlString
        }
      }
      return string
    }
    set {
      guard let newString = newValue,
            let attributedString = try? NSAttributedString(htmlString: newString)
      else {
        string = ""
        return
      }
      let item: [String: Any] = [
        kUTTypeRTF as String: attributedString.rtfData,
        kUTTypeHTML as String: attributedString.htmlString,
        kUTTypeUTF8PlainText as String: attributedString.string
      ]
      setItems([item])
    }
  }
  var hasHTML: Bool {
    contains(pasteboardTypes: [kUTTypeHTML as String, kUTTypeRTF as String])
  }
}
