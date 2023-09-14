// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

enum Encoding: String, Enumerable {
  // Equivalents of String.Encoding
  case ascii
  case nextstep
  case japaneseeuc
  case utf8
  case isolatin1
  case symbol
  case nonlossyascii
  case shiftjis
  case isolatin2
  case unicode
  case windowscp1251
  case windowscp1252
  case windowscp1253
  case windowscp1254
  case windowscp1250
  case iso2022jp
  case macosroman
  case utf16
  case utf16bigendian
  case utf16littleendian
  case utf32
  case utf32bigendian
  case utf32littleendian

  // Without equivalents in String.Encoding
  case base64

  func toStringEncoding() -> String.Encoding? {
    switch self {
    case .ascii:
      return .ascii
    case .nextstep:
      return .nextstep
    case .japaneseeuc:
      return .japaneseEUC
    case .utf8:
      return .utf8
    case .isolatin1:
      return .isoLatin1
    case .symbol:
      return .symbol
    case .nonlossyascii:
      return .nonLossyASCII
    case .shiftjis:
      return .shiftJIS
    case .isolatin2:
      return .isoLatin2
    case .unicode:
      return .unicode
    case .windowscp1251:
      return .windowsCP1251
    case .windowscp1252:
      return .windowsCP1252
    case .windowscp1253:
      return .windowsCP1253
    case .windowscp1254:
      return .windowsCP1254
    case .windowscp1250:
      return .windowsCP1250
    case .iso2022jp:
      return .iso2022JP
    case .macosroman:
      return .macOSRoman
    case .utf16:
      return .utf16
    case .utf16bigendian:
      return .utf16BigEndian
    case .utf16littleendian:
      return .utf16LittleEndian
    case .utf32:
      return .utf32
    case .utf32bigendian:
      return .utf32BigEndian
    case .utf32littleendian:
      return .utf32LittleEndian

      // Cases that don't have their own equivalent in String.Encoding
    case .base64:
      return nil
    }
  }
}
