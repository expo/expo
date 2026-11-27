// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Foundation
import Testing
import UIKit

@testable import ExpoLocalization
@testable import ExpoModulesCore

@Suite("LocalizationModule in JavaScript")
@JavaScriptActor
struct LocalizationModuleJavaScriptTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: LocalizationModule(appContext: appContext), name: nil)
  }

  private func eval(_ source: String) throws -> String {
    let runtime = runtime
    return try runtime.execute {
      return try runtime.eval(source).asString()
    }
  }

  @Test
  func `getLocales returns every locale field, with null for a missing value`() throws {
    let keys = try eval("JSON.stringify(Object.keys(expo.modules.ExpoLocalization.getLocales()[0]).sort())")
    #expect(
      keys == """
        ["currencyCode","currencySymbol","decimalSeparator","digitGroupingSeparator","languageCode",\
        "languageCurrencyCode","languageCurrencySymbol","languageRegionCode","languageScriptCode","languageTag",\
        "measurementSystem","regionCode","temperatureUnit","textDirection"]
        """
    )
    let hasUndefined = try eval(
      """
      String(expo.modules.ExpoLocalization.getLocales().some(locale => Object.values(locale).includes(undefined)))
      """
    )
    #expect(hasUndefined == "false")
  }

  @Test
  func `getCalendars returns the calendar fields with their JavaScript types`() throws {
    let types = try eval(
      """
      JSON.stringify(Object.entries(expo.modules.ExpoLocalization.getCalendars()[0]).map(([key, value]) => key + ':' + typeof value))
      """
    )
    #expect(types == #"["calendar:string","timeZone:string","uses24hourClock:boolean","firstWeekday:number"]"#)
  }

  @Test
  func `sends both events once for each notification until the last listener is removed`() throws {
    let runtime = runtime
    try runtime.execute {
      try runtime.eval(
        """
        globalThis.received = []
        globalThis.localeSubscription = expo.modules.ExpoLocalization.addListener('onLocaleSettingsChanged', payload => {
          received.push('locale:' + typeof payload)
        })
        globalThis.calendarSubscription = expo.modules.ExpoLocalization.addListener('onCalendarSettingsChanged', payload => {
          received.push('calendar:' + typeof payload)
        })
        """
      )
    }

    NotificationCenter.default.post(name: UIApplication.significantTimeChangeNotification, object: nil)
    #expect(try eval("JSON.stringify(received.splice(0))") == #"["locale:undefined","calendar:undefined"]"#)

    try runtime.execute {
      try runtime.eval("localeSubscription.remove()")
    }
    NotificationCenter.default.post(name: UIApplication.significantTimeChangeNotification, object: nil)
    #expect(try eval("JSON.stringify(received.splice(0))") == #"["calendar:undefined"]"#)

    try runtime.execute {
      try runtime.eval("calendarSubscription.remove()")
    }
    NotificationCenter.default.post(name: UIApplication.significantTimeChangeNotification, object: nil)
    #expect(try eval("JSON.stringify(received.splice(0))") == "[]")
  }
}
