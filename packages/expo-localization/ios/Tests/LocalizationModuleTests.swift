// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoLocalization

@Suite("LocalizationModule.uses24HourClock")
struct LocalizationModuleTests {
  @Test(arguments: [
    "en_GB", "de_DE", "ja_JP", "zh_CN", "fr_FR", "es_ES", "it_IT", "ru_RU", "pt_BR", "tr_TR",
    "pl_PL", "sv_SE", "he_IL", "fa_IR", "th_TH", "vi_VN", "id_ID", "sw_KE"
  ])
  func `returns true for a locale with a 24-hour clock`(identifier: String) {
    #expect(LocalizationModule.uses24HourClock(locale: Locale(identifier: identifier)))
  }

  @Test(arguments: [
    "en_US", "zh_Hant_HK", "en_AU", "en_CA", "en_IN", "es_MX", "ko_KR", "ar_EG", "ar_SA",
    "bn_BD", "fil_PH", "ms_MY", "el_GR", "am_ET", "ur_PK", "ta_IN"
  ])
  func `returns false for a locale with a 12-hour clock`(identifier: String) {
    #expect(!LocalizationModule.uses24HourClock(locale: Locale(identifier: identifier)))
  }

  // On iOS 27, the `j` template pattern of these locales is `Bh時`, `B h` and `Bh时`, without `a`.
  @Test(arguments: ["zh_Hant_TW", "hi_IN", "zh_Hans_SG"])
  func `returns false for a 12-hour locale that can mark the period with B`(identifier: String) {
    #expect(!LocalizationModule.uses24HourClock(locale: Locale(identifier: identifier)))
  }

  @Test(arguments: ["zh_CN@hours=h12", "en_GB@hours=h12", "en_US@hours=h11"])
  func `returns false when @hours sets a 12-hour cycle`(identifier: String) {
    #expect(!LocalizationModule.uses24HourClock(locale: Locale(identifier: identifier)))
  }

  @Test(arguments: ["en_US@hours=h23", "zh_Hant_TW@hours=h23", "en_GB@hours=h24"])
  func `returns true when @hours sets a 24-hour cycle`(identifier: String) {
    #expect(LocalizationModule.uses24HourClock(locale: Locale(identifier: identifier)))
  }
}
