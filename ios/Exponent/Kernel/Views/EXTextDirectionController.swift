// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class ExTextDirectionController: NSObject {
  class func getPreferredLangRTL() -> Bool {
    return NSLocale.characterDirection(forLanguage: NSLocale.preferredLanguages.first ?? "en-US") == NSLocale.LanguageDirection.rightToLeft
  }

  @objc
  public class func setRTLPref(_ allowRTL: Bool) {
    UserDefaults.standard.set(allowRTL, forKey: "RCTI18nUtil_allowRTL")
    UserDefaults.standard.set(allowRTL ? getPreferredLangRTL() : false, forKey: "RCTI18nUtil_forceRTL")
    UserDefaults.standard.synchronize()
  }
}
