// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXTextDirectionController: NSObject {
  class func isRTLPreferredForCurrentLocale() -> Bool {
    return NSLocale.characterDirection(forLanguage: NSLocale.preferredLanguages.first ?? "en-US") == NSLocale.LanguageDirection.rightToLeft
  }

  @objc
  public class func setRTLPreferences(_ supportsRTL: Bool, _ forceRTL: Bool) {
    // These keys are used by React Native here: https://github.com/facebook/react-native/blob/main/React/Modules/RCTI18nUtil.m
    // We set them before React loads to ensure it gets rendered correctly the first time the app is opened.
    // On iOS we need to set both forceRTL and allowRTL so apps don't have to include localization strings.
    if forceRTL {
      // Uses required reason API based on the following reason: CA92.1
      UserDefaults.standard.set(true, forKey: "RCTI18nUtil_allowRTL")
      UserDefaults.standard.set(true, forKey: "RCTI18nUtil_forceRTL")
    } else {
      UserDefaults.standard.set(supportsRTL, forKey: "RCTI18nUtil_allowRTL")
      UserDefaults.standard.set(supportsRTL ? isRTLPreferredForCurrentLocale() : false, forKey: "RCTI18nUtil_forceRTL")
    }

    UserDefaults.standard.synchronize()
  }
}
