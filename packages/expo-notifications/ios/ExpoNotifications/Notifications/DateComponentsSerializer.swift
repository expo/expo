class DateComponentsSerializer {

  static func serializedDateComponents(_ dateComponents: DateComponents) -> [String: Any] {
    var serializedComponents: [String: Any] = [:]
    serializedComponents["calendar"] = dateComponents.calendar?.identifier ?? NSNull()
    serializedComponents["timeZone"] = dateComponents.timeZone?.identifier ?? NSNull()
    serializedComponents["isLeapMonth"] = dateComponents.isLeapMonth ?? false
    if #available(iOS 26.0, *) {
      serializedComponents["isRepeatedDay"] = dateComponents.isRepeatedDay ?? false
    }


    let map = calendarUnitsConversionMap()
    for (calendarUnit, keyName) in map {
      if let unitValue = dateComponents.value(for: calendarUnit) {
        serializedComponents[keyName] = unitValue
      }
    }

    return serializedComponents
  }

  static func calendarUnitsConversionMap() -> [Calendar.Component: String] {
    return [
      .era: "era",
      .year: "year",
      .month: "month",
      .day: "day",
      .hour: "hour",
      .minute: "minute",
      .second: "second",
      .weekday: "weekday",
      .weekdayOrdinal: "weekdayOrdinal",
      .quarter: "quarter",
      .weekOfMonth: "weekOfMonth",
      .weekOfYear: "weekOfYear",
      .yearForWeekOfYear: "yearForWeekOfYear",
      .nanosecond: "nanosecond"
    ]
  }

}
