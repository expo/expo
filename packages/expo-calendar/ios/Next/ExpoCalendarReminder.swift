import EventKit
import ExpoModulesCore
import Foundation

internal final class ExpoCalendarReminder: ExpoCalendarItem {
  var reminder: EKReminder?

  override var calendarItem: EKCalendarItem? {
    return reminder
  }

  init(reminder: EKReminder) {
    self.reminder = reminder
  }

  override convenience init() {
    self.init(reminder: EKReminder(eventStore: CalendarModule.sharedEventStore))
  }

  convenience init(calendar: EKCalendar, reminderRecord: Reminder) throws {
    let sharedEventStore = CalendarModule.sharedEventStore

    if calendar.allowedEntityTypes.isDisjoint(with: [.reminder]) {
      throw InvalidCalendarTypeException((calendar.calendarIdentifier, "reminder"))
    }

    let calendarReminder = EKReminder(eventStore: sharedEventStore)
    calendarReminder.calendar = calendar
    calendarReminder.title = reminderRecord.title
    calendarReminder.location = reminderRecord.location
    calendarReminder.notes = reminderRecord.notes

    self.init(reminder: calendarReminder)
  }

  func update(reminderRecord: Reminder, nullableFields: [String]? = nil) throws {
    guard let reminder = self.reminder else {
      throw ItemNoLongerExistsException()
    }

    try self.initialize(reminderRecord: reminderRecord, nullableFields: nullableFields)

    try eventStore.save(reminder, commit: true)
  }

  func delete() throws {
    guard let reminder = self.reminder else {
      throw ItemNoLongerExistsException()
    }

    try eventStore.remove(reminder, commit: true)
    self.reminder = nil
  }

  // swiftlint:disable:next cyclomatic_complexity
  func initialize(reminderRecord: Reminder, calendar: EKCalendar? = nil, nullableFields: [String]? = nil) throws {
    guard let reminder else {
      throw ItemNoLongerExistsException()
    }

    let nullableSet = Set(nullableFields ?? [])

    if let calendar {
      reminder.calendar = calendar
    }

    if let title = reminderRecord.title {
      reminder.title = title
    }

    if nullableSet.contains("location") {
      reminder.location = nil
    } else if let location = reminderRecord.location {
      reminder.location = location
    }

    let startDate = parse(date: reminderRecord.startDate)
    let dueDate = parse(date: reminderRecord.dueDate)
    let completionDate = parse(date: reminderRecord.completionDate)

    if nullableSet.contains("timeZone") {
      reminder.timeZone = nil
    } else if let timeZone = reminderRecord.timeZone {
      if let eventTimeZone = TimeZone(identifier: timeZone) {
        reminder.timeZone = eventTimeZone
      } else {
        throw InvalidTimeZoneException(timeZone)
      }
    }

    if nullableSet.contains("alarms") {
      reminder.alarms = []
    } else if let alarms = reminderRecord.alarms {
      reminder.alarms = createCalendarEventAlarms(alarms: alarms)
    }

    if nullableSet.contains("recurrenceRule") {
      reminder.recurrenceRules = nil
    } else if let recurrenceRule = reminderRecord.recurrenceRule {
      if dueDate == nil && reminder.dueDateComponents == nil {
        throw DueDateRequiredException()
      }
      if let rule = createRecurrenceRule(rule: recurrenceRule) {
        reminder.recurrenceRules = [rule]
      }
    }

    if nullableSet.contains("url") {
      reminder.url = nil
    } else if let url = reminderRecord.url {
      reminder.url = URL(string: url)
    }

    let isAllDay = reminderRecord.allDay ?? false

    if nullableSet.contains("startDate") {
      reminder.startDateComponents = nil
    } else if let startDate {
      reminder.startDateComponents = createDateComponents(for: startDate, allDay: isAllDay)
    }

    if nullableSet.contains("dueDate") {
      reminder.dueDateComponents = nil
    } else if let dueDate {
      reminder.dueDateComponents = createDateComponents(for: dueDate, allDay: isAllDay)
    }

    if nullableSet.contains("completionDate") {
      reminder.completionDate = nil
    } else if let completionDate {
      reminder.completionDate = completionDate
    }

    if nullableSet.contains("notes") {
      reminder.notes = nil
    } else if let notes = reminderRecord.notes {
      reminder.notes = notes
    }

    if let isCompleted = reminderRecord.completed {
      reminder.isCompleted = isCompleted
    }
  }

  func isAllDay() -> Bool {
    guard let reminder else { return false }

    let components = [reminder.startDateComponents, reminder.dueDateComponents].compactMap { $0 }

    guard !components.isEmpty else { return false }

    return components.allSatisfy(isAllDayDateComponents)
  }

  private func isAllDayDateComponents(_ components: DateComponents) -> Bool {
    return components.hour == 0 && components.minute == 0 && components.second == 0
  }
}
