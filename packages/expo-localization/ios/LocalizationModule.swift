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

    Function("getPreferredLocales") {
      return Self.getPreferredLocales()
    }

    Function("getPreferredCalendars") {
      return Self.getPreferredCalendars()
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


  static func getPreferredLocales() -> [[String: Any?]] {
    return (Locale.preferredLanguages.isEmpty ? [Locale.current.identifier] : Locale.preferredLanguages).map { (languageTag) -> [String: Any?] in
      var locale = Locale.init(identifier: languageTag);
      return [
        "languageTag": languageTag,
        "languageCode": locale.languageCode,
        "regionCode": locale.regionCode,
        "textDirection": Locale.characterDirection(forLanguage: languageTag) == .rightToLeft ? "rtl" : "ltr",
        "decimalSeparator": locale.decimalSeparator,
        "digitGroupingSeparator": locale.groupingSeparator,
        "measurementSystem": locale.usesMetricSystem ? "metric" : "us",
        "currencyCode": locale.currencyCode,
        "currencySymbol": locale.currencySymbol,
      ] as [String: Any?]
    }
  }

  // https://stackoverflow.com/a/28183182
  static func uses24HourClock() -> Bool {
    let dateFormat = DateFormatter.dateFormat(fromTemplate: "j", options: 0, locale: Locale.current)!

    return dateFormat.firstIndex(of: "a") == nil
  }

  //    Alternatively we could separate into several functions (getCalendar, getTimeZone, getUses24hourClock), but I think it's better to return grouped vs singular values
  static func getPreferredCalendars() -> [[String: Any?]] {
    var calendar = Locale.current.calendar;
    return [
      [
        "calendar": "\(calendar.identifier)",
        "timeZone": "\(calendar.timeZone.identifier)",
        "uses24hourClock": uses24HourClock(),
        // we might want to subtract 1 to avoid confusion with 1..7 indexing, 1 is sunday
        "firstWeekday": calendar.firstWeekday,
        // timezone
      ]]
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
      "timezone": TimeZone.current.identifier,
    ]
  }
}
