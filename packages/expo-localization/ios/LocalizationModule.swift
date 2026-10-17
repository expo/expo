// Copyright 2021-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore
import React

let LOCALE_SETTINGS_CHANGED = "onLocaleSettingsChanged"
let CALENDAR_SETTINGS_CHANGED = "onCalendarSettingsChanged"

private let SUPPORTS_RTL_FROM_CONFIG = "ExpoLocalization_supportsRTLFromConfig"
private let FORCES_RTL_FROM_CONFIG = "ExpoLocalization_forcesRTLFromConfig"

let OBSERVED_EVENTS: Set<Notification.Name> = [
  // swiftlint:disable legacy_objc_type
  UIApplication.significantTimeChangeNotification,
  NSLocale.currentLocaleDidChangeNotification
  // swiftlint:enable legacy_objc_type
]

public class LocalizationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLocalization")

    Function("getLocales", Self.getLocales)
    Function("getCalendars", Self.getCalendars)

    OnCreate {
      setRTLPreferences()
    }

    Events(LOCALE_SETTINGS_CHANGED, CALENDAR_SETTINGS_CHANGED)

    OnStartObserving {
      OBSERVED_EVENTS.forEach {
        NotificationCenter.default.addObserver(
          self,
          selector: #selector(LocalizationModule.localeChanged),
          name: $0,
          object: nil
        )
      }
    }

    OnStopObserving {
      OBSERVED_EVENTS.forEach {
        NotificationCenter.default.removeObserver(
          self,
          name: $0,
          object: nil
        )
      }
    }
  }

  func setRTLPreferences() {
    // The config plugin writes an Info.plist key only for a non-default value, so a missing key means either
    // "not configured" or "no longer configured". We remember which values came from the config to tell the
    // two apart, instead of writing the defaults on every launch and overwriting the app's own
    // I18nManager.allowRTL / forceRTL calls.
    let supportsRTL = Bundle.main.object(forInfoDictionaryKey: "ExpoLocalization_supportsRTL") as? Bool
    let forcesRTL = Bundle.main.object(forInfoDictionaryKey: "ExpoLocalization_forcesRTL") as? Bool

    // We call these methods before React loads to ensure it gets rendered correctly the first time the app is opened.
    // Uses required reason API based on the following reason: CA92.1
    if let i18nUtil = RCTI18nUtil.sharedInstance() {
      if let allowRTL = Self.resolveRTLPreference(supportsRTL, fromConfigKey: SUPPORTS_RTL_FROM_CONFIG, default: true) {
        i18nUtil.allowRTL(allowRTL)
      }
      if let forceRTL = Self.resolveRTLPreference(forcesRTL, fromConfigKey: FORCES_RTL_FROM_CONFIG, default: false) {
        i18nUtil.forceRTL(forceRTL)
      }
    }
  }

  /**
   The value to write for an RTL preference, or `nil` to leave the stored preference alone. Whether the value
   came from the app config is recorded, so that dropping the option restores the React Native default
   exactly once, on the first launch without it.
   */
  static func resolveRTLPreference(
    _ configValue: Bool?,
    fromConfigKey: String,
    default defaultValue: Bool,
    userDefaults: UserDefaults = .standard
  ) -> Bool? {
    let wasFromConfig = userDefaults.bool(forKey: fromConfigKey)

    if wasFromConfig != (configValue != nil) {
      if configValue != nil {
        userDefaults.set(true, forKey: fromConfigKey)
      } else {
        userDefaults.removeObject(forKey: fromConfigKey)
      }
    }

    return configValue ?? (wasFromConfig ? defaultValue : nil)
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
    @unknown default:
      log.error("Unhandled `Calendar.Identifier` value: \(calendar.identifier), returning `iso8601` as fallback. Add the missing case as soon as possible.")
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
            "languageScriptCode": languageLocale.language.script?.identifier,
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
          "languageScriptCode": languageLocale.scriptCode,
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

  static func uses24HourClock(locale: Locale = .current) -> Bool {
    let hourCycle = locale.hourCycle
    return hourCycle == .zeroToTwentyThree || hourCycle == .oneToTwentyFour
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
}
