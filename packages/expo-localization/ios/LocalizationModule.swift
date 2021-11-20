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

  static func getCurrentLocalization() -> [String: Any?] {
    let locale = Locale.current
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
