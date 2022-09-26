// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

public class LocalizationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLocalization")

    Constants {
      return Self.getCurrentLocalization()
    }
    AsyncFunction("getLocalizationAsync") {
      return Self.getCurrentLocalization()
    }
    Function("getLocales") {
      return Self.getLocales()
    }
    Function("getCalendars") {
      return Self.getCalendars()
    }
  }

  // If the application isn't manually localized for the device language then the
  // native `Locale.current` will fallback on using English US
  // [cite](https://stackoverflow.com/questions/48136456/locale-current-reporting-wrong-language-on-device).
  // This method will attempt to return the locale that the device is using regardless of the app,
  // providing better parity across platforms.
  static func getLocale() -> Locale {
    guard let preferredIdentifier = Locale.preferredLanguages.first else {
      return Locale.current
    }
    return Locale(identifier: preferredIdentifier)
  }

  static func getUnicodeCalendarIdentifier(calendar: Calendar) -> String {
    // Maps ios unique identifiers to [BCP 47 calendar types](https://github.com/unicode-org/cldr/blob/main/common/bcp47/calendar.xml)
    switch(calendar.identifier) {
      case .buddhist:
        return "buddhist"
      case .chinese:
        return "chinese"
      case .coptic:
        return "coptic"
      case .ethiopicAmeteAlem:
        return "ethioaa"
      case .ethiopicAmeteMihret:
        return "ethiopic"
      case .gregorian:
        return "gregory"
      case .hebrew:
        return "hebrew"
      case .indian:
        return "indian"
      case .islamic:
        return "islamic"
      case .islamicCivil:
        return "islamic-civil"
      case .islamicTabular:
        return "islamic-tbla"
      case .islamicUmmAlQura:
        return "islamic-umalqura"
      case .japanese:
        return "japanese"
      case .persian:
        return "persian"
      case .republicOfChina:
        return "roc"
      case .iso8601:
        return "iso8601"
    }
  }

  static func getLocales() -> [[String: Any?]] {
    return (Locale.preferredLanguages.isEmpty ? [Locale.current.identifier] : Locale.preferredLanguages)
      .map { languageTag -> [String: Any?] in
        var locale = Locale.init(identifier: languageTag)
        return [
          "languageTag": languageTag,
          "languageCode": locale.languageCode,
          "regionCode": locale.regionCode,
          "textDirection": Locale.characterDirection(forLanguage: languageTag) == .rightToLeft ? "rtl" : "ltr",
          "decimalSeparator": locale.decimalSeparator,
          "digitGroupingSeparator": locale.groupingSeparator,
          "measurementSystem": locale.usesMetricSystem ? "metric" : "us",
          "currencyCode": locale.currencyCode,
          "currencySymbol": locale.currencySymbol
        ]
      }
  }

  // https://stackoverflow.com/a/28183182
  static func uses24HourClock() -> Bool {
    let dateFormat = DateFormatter.dateFormat(fromTemplate: "j", options: 0, locale: Locale.current)!

    return dateFormat.firstIndex(of: "a") == nil
  }

  static func getCalendars() -> [[String: Any?]] {
    var calendar = Locale.current.calendar
    return [
      [
        "calendar": getUnicodeCalendarIdentifier(calendar: calendar),
        "timeZone": "\(calendar.timeZone.identifier)",
        "uses24hourClock": uses24HourClock(),
        "firstWeekday": calendar.firstWeekday
      ]
    ]
  }

  static func getCurrentLocalization() -> [String: Any?] {
    let locale = getLocale()
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
