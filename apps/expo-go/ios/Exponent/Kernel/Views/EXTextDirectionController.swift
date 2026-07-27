// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React

@objc
public class EXTextDirectionController: NSObject {
  @objc
  public class func setRTLPreferences(_ supportsRTL: Bool, _ forcesRTL: Bool) {
    // We call these methods before React loads to ensure it gets rendered correctly the first time the app is opened.
    // Uses required reason API based on the following reason: CA92.1
    if let i18nUtil = RCTI18nUtil.sharedInstance() {
      i18nUtil.allowRTL(supportsRTL)
      i18nUtil.forceRTL(forcesRTL)
    }
  }
}
