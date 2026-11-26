// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore

@Record
struct LocaleInfo {
  var languageTag: String
  var languageCode: String?
  var languageScriptCode: String?
  var languageRegionCode: String?
  var regionCode: String?
  var textDirection: String
  var decimalSeparator: String?
  var digitGroupingSeparator: String?
  var measurementSystem: String
  var currencyCode: String?
  var currencySymbol: String?
  var languageCurrencyCode: String?
  var languageCurrencySymbol: String?
  var temperatureUnit: String?
}

@Record
struct CalendarInfo {
  var calendar: String
  var timeZone: String
  var uses24hourClock: Bool
  var firstWeekday: Int
}
