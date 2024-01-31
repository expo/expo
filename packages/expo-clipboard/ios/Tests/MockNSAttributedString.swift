// Copyright 2018-present 650 Industries. All rights reserved.

import Foundation
@testable import ExpoClipboard

/**
 A  mocked `NSAttributedString+utilities` for unit tests
 `NSAttributedString` HTML processor requires main thread and it is slow. It may break unit test occasionally.
 This mocked version just returns the raw string.
 */
class MockNSAttributedString: NSAttributedString {
  convenience init(htmlString: String) throws {
    self.init(string: htmlString)
  }

  override var rtfData: Data? {
    return try? self.data(
      from: NSRange(location: 0, length: self.length),
      documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
    )
  }

  override var htmlString: String? {
    return self.string
  }
}

func swizzleNSAttributedString() {
  // swiftlint:disable force_unwrapping
  method_exchangeImplementations(
    class_getInstanceMethod(NSAttributedString.self, #selector(NSAttributedString.init(htmlString:)))!,
    class_getInstanceMethod(MockNSAttributedString.self, #selector(MockNSAttributedString.init(htmlString:)))!
  )
  method_exchangeImplementations(
    class_getInstanceMethod(NSAttributedString.self, #selector(getter: NSAttributedString.rtfData))!,
    class_getInstanceMethod(MockNSAttributedString.self, #selector(getter: MockNSAttributedString.rtfData))!
  )
  method_exchangeImplementations(
    class_getInstanceMethod(NSAttributedString.self, #selector(getter: NSAttributedString.htmlString))!,
    class_getInstanceMethod(MockNSAttributedString.self, #selector(getter: MockNSAttributedString.htmlString))!
  )
  // swiftlint:enable force_unwrapping
}
