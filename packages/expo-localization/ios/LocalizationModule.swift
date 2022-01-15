// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

public class LocalizationModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoLocalization")

    constants {
      return Self.getCurrentLocalization()
    }

    function("getLocalizationAsync") {
      return Self.getCurrentLocalization()
    }
  }
  
  // If the application isn't manually localized for the device language then the
  // native `Locale.current` will fallback on using English US
  // [cite](https://stackoverflow.com/questions/48136456/locale-current-reporting-wrong-language-on-device).
  // This method will attempt to return the locale that the device is using regardless of the app,
  // providing better parity across platforms.
  static func getPreferredLocale() -> Locale {
      guard let preferredIdentifier = Locale.preferredLanguages.first else {
          return Locale.current
      }
      return Locale(identifier: preferredIdentifier)
  }

  static func getCurrentLocalization() -> [String: Any?] {
    let locale = getPreferredLocale()
    let languageCode = locale.languageCode ?? "en"
    var languageIds = Locale.preferredLanguages

    if languageIds.isEmpty {
      languageIds.append("en-US")
    }
    return [
      "currency": locale.currencyCode ?? "USD",
      "decimalSeparator": locale.decimalSeparator ?? ".",
      "digitGroupingSeparator": locale.groupingSeparator ?? ",",
      "isoCurrencyCodes": Locale.isoCurrencyCodes,
      "isMetric": locale.usesMetricSystem,
      "isRTL": Locale.characterDirection(forLanguage: languageCode) == .rightToLeft,
      "locale": languageIds.first,
      "locales": languageIds,
      "region": locale.regionCode ?? "US",
      "timezone": TimeZone.current.identifier
    ]
  }
}
