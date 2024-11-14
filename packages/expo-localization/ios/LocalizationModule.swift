// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

let LOCALE_SETTINGS_CHANGED = "onLocaleSettingsChanged"
let CALENDAR_SETTINGS_CHANGED = "onCalendarSettingsChanged"

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
    OnCreate {
      if let forceRTL = Bundle.main.object(forInfoDictionaryKey: "ExpoLocalization_forcesRTL") as? Bool {
        self.setRTLPreferences(true, forceRTL)
      } else {
        if let enableRTL = Bundle.main.object(forInfoDictionaryKey: "ExpoLocalization_supportsRTL") as? Bool {
          self.setRTLPreferences(enableRTL, false)
        }
      }
    }

    Events(LOCALE_SETTINGS_CHANGED, CALENDAR_SETTINGS_CHANGED)

    OnStartObserving {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(LocalizationModule.localeChanged),
        name: NSLocale.currentLocaleDidChangeNotification, // swiftlint:disable:this legacy_objc_type
        object: nil
      )
    }

    OnStopObserving {
      NotificationCenter.default.removeObserver(
        self,
        name: NSLocale.currentLocaleDidChangeNotification, // swiftlint:disable:this legacy_objc_type
        object: nil
      )
    }
  }

  func isRTLPreferredForCurrentLocale() -> Bool {
    // swiftlint:disable:next legacy_objc_type
    return NSLocale.characterDirection(forLanguage: NSLocale.preferredLanguages.first ?? "en-US") == NSLocale.LanguageDirection.rightToLeft
  }

  func setRTLPreferences(_ supportsRTL: Bool, _ forceRTL: Bool) {
    // These keys are used by React Native here: https://github.com/facebook/react-native/blob/main/React/Modules/RCTI18nUtil.m
    // We set them before React loads to ensure it gets rendered correctly the first time the app is opened.
    // On iOS we need to set both forceRTL and allowRTL so apps don't have to include localization strings.
    // Uses required reason API based on the following reason: CA92.1

    if forceRTL {
      UserDefaults.standard.set(true, forKey: "RCTI18nUtil_allowRTL")
      UserDefaults.standard.set(true, forKey: "RCTI18nUtil_forceRTL")
    } else {
      UserDefaults.standard.set(supportsRTL, forKey: "RCTI18nUtil_allowRTL")
      UserDefaults.standard.set(supportsRTL ? isRTLPreferredForCurrentLocale() : false, forKey: "RCTI18nUtil_forceRTL")
    }

    UserDefaults.standard.synchronize()
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
  /**
   Maps ios unique identifiers to [BCP 47 calendar types]
   (https://github.com/unicode-org/cldr/blob/main/common/bcp47/calendar.xml)
   */
  static func getUnicodeCalendarIdentifier(calendar: Calendar) -> String {
    switch calendar.identifier {
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

  static func getMeasurementSystemForLocale(_ locale: Locale) -> String {
    if #available(iOS 16, tvOS 16, *) {
      let measurementSystems = [
        Locale.MeasurementSystem.us: "us",
        Locale.MeasurementSystem.uk: "uk",
        Locale.MeasurementSystem.metric: "metric"
      ]
      return measurementSystems[locale.measurementSystem] ?? "metric"
    }
    return locale.usesMetricSystem ? "metric" : "us"
  }

  static func getLocales() -> [[String: Any?]] {
    let userSettingsLocale = Locale.current

    return (Locale.preferredLanguages.isEmpty ? [Locale.current.identifier] : Locale.preferredLanguages)
      .map { languageTag -> [String: Any?] in
        let languageLocale = Locale.init(identifier: languageTag)

        if #available(iOS 16, tvOS 16, *) {
          return [
            "languageTag": languageTag,
            "languageCode": languageLocale.language.languageCode?.identifier,
            "languageRegionCode": languageLocale.region?.identifier,
            "regionCode": userSettingsLocale.region?.identifier,
            "textDirection": languageLocale.language.characterDirection == .rightToLeft ? "rtl" : "ltr",
            "decimalSeparator": userSettingsLocale.decimalSeparator,
            "digitGroupingSeparator": userSettingsLocale.groupingSeparator,
            "measurementSystem": getMeasurementSystemForLocale(userSettingsLocale),
            "currencyCode": userSettingsLocale.currencyCode,
            "currencySymbol": userSettingsLocale.currencySymbol,
            "languageCurrencyCode": languageLocale.currencyCode,
            "languageCurrencySymbol": languageLocale.currencySymbol,
            "temperatureUnit": getTemperatureUnit()
          ]
        }
        return [
          "languageTag": languageTag,
          "languageCode": languageLocale.languageCode,
          "languageRegionCode": languageLocale.regionCode,
          "regionCode": userSettingsLocale.regionCode,
          "textDirection": Locale.characterDirection(forLanguage: languageTag) == .rightToLeft ? "rtl" : "ltr",
          "decimalSeparator": userSettingsLocale.decimalSeparator,
          "digitGroupingSeparator": userSettingsLocale.groupingSeparator,
          "measurementSystem": getMeasurementSystemForLocale(userSettingsLocale),
          "currencyCode": userSettingsLocale.currencyCode,
          "currencySymbol": userSettingsLocale.currencySymbol,
          "languageCurrencyCode": languageLocale.currencyCode,
          "languageCurrencySymbol": languageLocale.currencySymbol,
          "temperatureUnit": getTemperatureUnit()
        ]
      }
  }

  @objc
  private func localeChanged() {
    // we send both events since on iOS it means both calendar and locale needs an update
    sendEvent(LOCALE_SETTINGS_CHANGED)
    sendEvent(CALENDAR_SETTINGS_CHANGED)
  }

  static func getTemperatureUnit() -> String? {
    let formatter = MeasurementFormatter()
    formatter.locale = Locale.current

    let temperature = Measurement(value: 0, unit: UnitTemperature.celsius)
    let formatted = formatter.string(from: temperature)

    guard let unitCharacter = formatted.last else {
      return nil
    }

    return unitCharacter == "F" ? "fahrenheit" : "celsius"
  }

  // https://stackoverflow.com/a/28183182
  static func uses24HourClock() -> Bool {
    let dateFormat = DateFormatter.dateFormat(fromTemplate: "j", options: 0, locale: Locale.current)!

    return dateFormat.firstIndex(of: "a") == nil
  }

  static func getCalendars() -> [[String: Any?]] {
    let calendar = Locale.current.calendar
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
