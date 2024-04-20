import ExpoModulesCore
import EventKit

func parse(date: Either<String, Double>?) -> Date? {
  guard let date else {
    return nil
  }

  if let date: Double = date.get() {
    return Date(timeIntervalSince1970: TimeInterval(date / 1000.0))
  }

  if let date: String = date.get() {
    return dateFormatter.date(from: date)
  }

  return nil
}

func parse(date: String?) -> Date? {
  guard let date else {
    return nil
  }
  return dateFormatter.date(from: date)
}

func createRecurrenceRule(rule: RecurrenceRule) -> EKRecurrenceRule? {
  guard ["daily", "weekly", "monthly", "yearly"].contains(rule.frequency) else {
    return nil
  }
  var endDate = parse(date: rule.endDate)

  let daysOfTheWeek = rule.daysOfTheWeek?.map { day in
    EKRecurrenceDayOfWeek(day.dayOfTheWeek.toEKType(), weekNumber: day.weekNumber)
  }

  // swiftlint:disable legacy_objc_type
  let daysOfTheMonth = rule.daysOfTheMonth?.map {
    NSNumber(value: $0)
  }
  let monthsOfTheYear = rule.monthsOfTheYear?.map {
    NSNumber(value: $0.rawValue)
  }
  let weeksOfTheYear = rule.weeksOfTheYear?.map {
    NSNumber(value: $0)
  }
  let daysOfTheYear = rule.daysOfTheYear?.map {
    NSNumber(value: $0)
  }
  let setPositions = rule.setPositions?.map {
    NSNumber(value: $0)
  }
  // swiftlint:enable legacy_objc_type

  var recurrenceEnd: EKRecurrenceEnd?
  var recurrenceInterval = 1

  if let endDate {
    recurrenceEnd = EKRecurrenceEnd(end: endDate)
  } else if let occurrence = rule.occurrence, occurrence > 0 {
    recurrenceEnd = EKRecurrenceEnd(occurrenceCount: occurrence)
  }

  if let interval = rule.interval, interval > 0 {
    recurrenceInterval = interval
  }

  return EKRecurrenceRule(
    recurrenceWith: recurrenceFrequencyToString(name: rule.frequency),
    interval: recurrenceInterval,
    daysOfTheWeek: daysOfTheWeek,
    daysOfTheMonth: daysOfTheMonth,
    monthsOfTheYear: monthsOfTheYear,
    weeksOfTheYear: weeksOfTheYear,
    daysOfTheYear: daysOfTheYear,
    setPositions: setPositions,
    end: recurrenceEnd
  )
}

func createCalendarEventAlarms(alarms: [Alarm]) -> [EKAlarm] {
  var calendarEventAlarms = [EKAlarm]()

  for alarm in alarms {
    if alarm.absoluteDate != nil || alarm.relativeOffset != nil || alarm.structuredLocation != nil {
      if let reminderAlarm = createCalendarEventAlarm(alarm: alarm) {
        calendarEventAlarms.append(reminderAlarm)
      }
    }
  }

  return calendarEventAlarms
}

func createCalendarEventAlarm(alarm: Alarm) -> EKAlarm? {
  var calendarEventAlarm: EKAlarm?
  let date = parse(date: alarm.absoluteDate)
  let relativeOffset = alarm.relativeOffset

  if let date {
    calendarEventAlarm = EKAlarm.init(absoluteDate: date)
  } else if let relativeOffset {
    calendarEventAlarm = EKAlarm(relativeOffset: TimeInterval(60 * relativeOffset))
  } else {
    calendarEventAlarm = EKAlarm()
  }

  if let locationOptions = alarm.structuredLocation {
    if let geo = locationOptions.coords {
      let geoLocation = CLLocation(latitude: geo.latitude, longitude: geo.longitude)
      calendarEventAlarm?.structuredLocation = EKStructuredLocation(title: locationOptions.title)
      calendarEventAlarm?.structuredLocation?.geoLocation = geoLocation
      calendarEventAlarm?.structuredLocation?.radius = locationOptions.radius ?? 0.0

      if let proximity = locationOptions.proximity {
        if proximity == "enter" {
          calendarEventAlarm?.proximity = .enter
        } else if proximity == "leave" {
          calendarEventAlarm?.proximity = .leave
        }
      } else {
        calendarEventAlarm?.proximity = .none
      }
    }
  }

  return calendarEventAlarm
}

func createDateComponents(for date: Date) -> DateComponents {
  let currentCalendar = Calendar.current
  let dateComponents: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]

  return currentCalendar.dateComponents(
    dateComponents,
    from: date
  )
}

func getAvailability(availability: String) -> EKEventAvailability {
  switch availability {
  case "busy":
    return .busy
  case "free":
    return .free
  case "tentative":
    return .tentative
  case "unavailable":
    return .unavailable
  default:
    return .notSupported
  }
}
