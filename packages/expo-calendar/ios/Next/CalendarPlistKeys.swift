import Foundation

enum CalendarPlistKeys {
  static var calendarFullAccess: String {
    if #available(iOS 17.0, *) {
      return "NSCalendarsFullAccessUsageDescription"
    }
    return "NSCalendarsUsageDescription"
  }

  static var calendarWriteOnly: String {
    if #available(iOS 17.0, *) {
      return "NSCalendarsWriteOnlyAccessUsageDescription"
    }
    return "NSCalendarsUsageDescription"
  }

  static func isIncludedInInfoPlist(_ key: String) -> Bool {
    return Bundle.main.object(forInfoDictionaryKey: key) != nil
  }
}
