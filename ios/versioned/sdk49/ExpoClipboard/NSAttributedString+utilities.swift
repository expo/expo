// Copyright 2018-present 650 Industries. All rights reserved.

import MobileCoreServices

extension NSAttributedString {
  convenience init(htmlString: String) throws {
    let initOptions: [DocumentReadingOptionKey: Any] = [
      .documentType: NSAttributedString.DocumentType.html
    ]
    try self.init(data: Data(htmlString.utf8), options: initOptions, documentAttributes: nil)
  }

  var rtfData: Data? {
    let range = NSRange(location: 0, length: self.length)
    let attributes: [DocumentAttributeKey: Any] = [
      .documentType: NSAttributedString.DocumentType.rtf,
      .characterEncoding: String.Encoding.utf8
    ]
    return try? self.data(from: range, documentAttributes: attributes)
  }

  var htmlString: String? {
    do {
      let range = NSRange(location: 0, length: self.length)
      let attributes: [DocumentAttributeKey: Any] = [
        .documentType: NSAttributedString.DocumentType.html
      ]
      let htmlData = try self.data(from: range, documentAttributes: attributes)
      return String(data: htmlData, encoding: .utf8)
    } catch {
      return nil
    }
  }
}
