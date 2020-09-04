// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

class DevMenuUtils {
  /**
   Swizzles implementations of given selectors.
   */
  static func swizzle(selector selectorA: Selector, withSelector selectorB: Selector, forClass: AnyClass) {
    if let methodA = class_getInstanceMethod(forClass, selectorA),
      let methodB = class_getInstanceMethod(forClass, selectorB) {
      method_exchangeImplementations(methodA, methodB)
    }
  }

  /**
   Strips `RCT` prefix from given string.
   */
  static func stripRCT(_ str: String) -> String {
    return str.starts(with: "RCT") ? String(str.dropFirst(3)) : str
  }
  
  static func resourcesBundle() -> Bundle? {
    let frameworkBundle = Bundle(for: DevMenuUtils.self)

    guard let resourcesBundleUrl = frameworkBundle.url(forResource: "EXDevMenu", withExtension: "bundle") else {
      return nil
    }
    return Bundle(url: resourcesBundleUrl)
  }
}
