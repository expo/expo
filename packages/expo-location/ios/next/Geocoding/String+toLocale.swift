import ExpoModulesCore

extension String {
  func toLocale() -> Locale {
    let locale = Locale(identifier: self)
    let isISOLanguage = locale.language.languageCode?.isISOLanguage ?? false
    if !isISOLanguage {
      log.warn("[expo-location] The locale '\(self)' has no recognized language code, so geocoding results use the device language. Pass a BCP 47 tag such as 'en-US'.")
    }
    return locale
  }
}
