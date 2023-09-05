import ExpoModulesCore
import CoreLocation
import EventKit

public class CalendarModule: Module {
  private var permittedEntities: EKEntityMask = .event
  private var eventStore = EKEventStore()

  public func definition() -> ModuleDefinition {
    Name("ExpoCalendar")

    OnCreate {
      self.appContext?.permissions?.register([
        CalendarPermissionsRequester(),
        RemindersPermissionRequester()
      ])
      initializePermittedEntities()
    }

    AsyncFunction("getCalendarsAsync") { (type: CalendarEntity?) -> [[String: Any?]] in
      var calendars: [EKCalendar]
      if type == nil {
        try checkCalendarPermissions()
        try checkRemindersPermissions()

        let eventCalendars = eventStore.calendars(for: .event)
        let reminderCalendars = eventStore.calendars(for: .reminder)
        calendars = eventCalendars + reminderCalendars
      } else if type == .event {
        try checkCalendarPermissions()
        calendars = eventStore.calendars(for: .event)
      } else if type == .reminder {
        try checkRemindersPermissions()
        calendars = eventStore.calendars(for: .reminder)
      } else {
        throw InvalidCalendarEntityException(type?.rawValue)
      }

      return serializeCalendars(calendars: calendars)
    }

    AsyncFunction("getDefaultCalendarAsync") { () -> [String: Any] in
      try checkCalendarPermissions()
      let defaultcalendar = eventStore.defaultCalendarForNewEvents

      if let defaultcalendar {
        return serializeCalendar(calendar: defaultcalendar)
      }
      throw DefaultCalendarsNotFoundException()
    }

    AsyncFunction("saveCalendarAsync") { (details: CalendarRecord) -> String in
      try checkCalendarPermissions()
      var calendar: EKCalendar?

      if let id = details.id {
        calendar = eventStore.calendar(withIdentifier: id)

        if calendar?.isImmutable == true {
          throw CalendarNotSavedException((details.title, ""))
        }
      } else {
        if details.entityType == .event {
          calendar = .init(for: .event, eventStore: eventStore)
        } else if details.entityType == .reminder {
          calendar = .init(for: .reminder, eventStore: eventStore)
        } else {
          throw EntityNotSupportedException(details.entityType?.rawValue)
        }

        if let sourceId = details.sourceId {
          calendar?.source = eventStore.source(withIdentifier: sourceId)
        } else {
          calendar?.source = details.entityType == .event ?
          eventStore.defaultCalendarForNewEvents?.source :
          eventStore.defaultCalendarForNewReminders()?.source
        }
      }

      calendar?.title = details.title
      calendar?.cgColor = EXUtilities.uiColor(details.color)?.cgColor

      if let calendar {
        do {
          try eventStore.saveCalendar(calendar, commit: true)
          return calendar.calendarIdentifier
        } catch {
          throw CalendarNotSavedException((details.title, error.localizedDescription))
        }
      }

      throw CalendarIdNotFoundException(details.id ?? "")
    }

    AsyncFunction("deleteCalendarAsync") { (calendarId: String) in
      try checkCalendarPermissions()
      let calendar = eventStore.calendar(withIdentifier: calendarId)

      guard let calendar else {
        throw CalendarIdNotFoundException(calendarId)
      }

      try eventStore.removeCalendar(calendar, commit: true)
    }

    AsyncFunction("getEventsAsync") { (startDateStr: String, endDateStr: String, calendarIds: [String]) -> [[String: Any?]] in
      try checkCalendarPermissions()
      guard let startDate = parse(date: startDateStr),
            let endDate = parse(date: endDateStr) else {
        throw InvalidDateFormatException()
      }

      var eventCalendars = [EKCalendar]()
      if !calendarIds.isEmpty {
        let deviceCalendars = eventStore.calendars(for: .event)

        for calendar in deviceCalendars {
          if calendarIds.contains(calendar.calendarIdentifier) {
            eventCalendars.append(calendar)
          }
        }
      }

      let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: eventCalendars)

      let calendarEvents = eventStore.events(matching: predicate).sorted {
        $0.startDate < $1.startDate
      }

      return serializeCalendar(events: calendarEvents)
    }

    AsyncFunction("getEventByIdAsync") { (eventId: String, startDateStr: String?) -> [String: Any?] in
      try checkCalendarPermissions()

      let startDate = parse(date: startDateStr)
      let calendarEvent = getEvent(with: eventId, startDate: startDate)

      if let calendarEvent {
        return serializeCalendar(event: calendarEvent)
      }
      throw CalendarEventNotFoundException(eventId)
    }

    AsyncFunction("saveEventAsync") { (details: Event, options: RecurringEventOptions) -> String? in
      try checkCalendarPermissions()
      var calendarEvent: EKEvent?
      let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent

      if let id = details.id {
        if let instanceStartDate = options.instanceStartDate, let date = parse(date: instanceStartDate) {
          guard let event = getEvent(with: id, startDate: date) else {
            throw CalendarEventNotFoundException(id)
          }
          calendarEvent = event
        }
      } else {
        guard let calendarId = details.calendarId else {
          throw CalendarIdRequiredException()
        }
        let calendar = eventStore.calendar(withIdentifier: calendarId)
        guard let calendar else {
          throw CalendarIdNotFoundException(calendarId)
        }

        if calendar.allowedEntityTypes.isDisjoint(with: [.event]) {
          throw InvalidCalendarType((calendarId, "event"))
        }

        calendarEvent = EKEvent(eventStore: eventStore)
        calendarEvent?.calendar = calendar
      }

      calendarEvent?.title = details.title
      calendarEvent?.location = details.location
      calendarEvent?.notes = details.notes

      if let timeZone = details.timeZone {
        if let tz = TimeZone(identifier: timeZone) {
          calendarEvent?.timeZone = tz
        } else {
          throw InvalidTimeZoneException()
        }
      }

      calendarEvent?.alarms = createCalendarEventAlarms(alarms: details.alarms)
      if let rule = details.recurrenceRule {
        let newRule = createRecurrenceRule(rule: rule)

        if let newRule {
          calendarEvent?.recurrenceRules = [newRule]
        }
      }

      if let urlString = details.url?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed), let url = URL(string: urlString) {
        calendarEvent?.url = url
      }

      calendarEvent?.startDate = parse(date: details.startDate)
      calendarEvent?.endDate = parse(date: details.endDate)
      calendarEvent?.isAllDay = details.allDay
      calendarEvent?.availability = getAvailability(availability: details.availability)

      if let calendarEvent {
        try eventStore.save(calendarEvent, span: span, commit: true)
        return calendarEvent.calendarItemIdentifier
      }
      return nil
    }

    AsyncFunction("deleteEventAsync") { (event: Event, options: RecurringEventOptions) in
      try checkCalendarPermissions()
      guard let id = event.id else {
        throw EventIdRequired()
      }
      let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent

      let instanceStartDate = parse(date: event.instanceStartDate)
      let calendarEvent = getEvent(with: id, startDate: instanceStartDate)

      if let calendarEvent {
        try eventStore.remove(calendarEvent, span: span)
      }
    }

    AsyncFunction("getAttendeesForEventAsync") { (event: Event) -> [[String: Any?]] in
      try checkCalendarPermissions()
      guard let id = event.id else {
        throw EventIdRequired()
      }
      let instanceStartDate = parse(date: event.instanceStartDate)

      let item = getEvent(with: id, startDate: instanceStartDate)

      if let item {
        if item.hasAttendees {
          return serialize(attendees: item.attendees!)
        } else {
          return []
        }
      }
      throw CalendarEventNotFoundException(id)
    }

    AsyncFunction("getRemindersAsync") { (startDateStr: String, endDateStr: String, calendars: [CalendarRecord], status: String?, promise: Promise) in
      try checkRemindersPermissions()
      var reminderCalendars: [EKCalendar]?
      let startDate = parse(date: startDateStr)
      let endDate = parse(date: endDateStr)

      if !calendars.isEmpty {
        reminderCalendars = []
        let deviceCalendars = eventStore.calendars(for: .reminder)

        for calendar in deviceCalendars {
          if calendars.contains(where: { cal in
            cal.id == calendar.calendarIdentifier
          }) {
            reminderCalendars?.append(calendar)
          }
        }
      } else {
        promise.reject(CalendarMissingParameterException())
        return
      }

      let predicate: NSPredicate = {
        if let status {
          if status == "incomplete" {
            return eventStore.predicateForIncompleteReminders(withDueDateStarting: startDate, ending: endDate, calendars: reminderCalendars)
          } else if status == "completed" {
            return eventStore.predicateForCompletedReminders(withCompletionDateStarting: startDate, ending: endDate, calendars: reminderCalendars)
          }
        }
        return eventStore.predicateForReminders(in: reminderCalendars)
      }()

      eventStore.fetchReminders(matching: predicate) { [promise] reminders in
        if let reminders {
          promise.resolve(serialize(reminders: reminders))
        } else {
          promise.resolve([])
        }
      }
    }

    AsyncFunction("getReminderByIdAsync") { (reminderId: String) -> [String: Any?]  in
      try checkRemindersPermissions()
      let reminder = eventStore.calendarItem(withIdentifier: reminderId) as? EKReminder

      if let reminder {
        return serialize(reminder: reminder)
      } else {
        throw ReminderNotFoundException(reminderId)
      }
    }

    AsyncFunction("saveReminderAsync") { (details: Reminder) -> String  in
      try checkRemindersPermissions()
      var reminder: EKReminder
      let startDate = parse(date: details.startDate)
      let dueDate = parse(date: details.dueDate)
      let completionDate = parse(date: details.completionDate)

      let currentCalendar = NSCalendar.current

      if let reminderId = details.id {
        guard let reminderWithId =  eventStore.calendarItem(withIdentifier: reminderId) as? EKReminder else {
          throw ReminderNotFoundException(reminderId)
        }
        reminder = reminderWithId
      } else {
        reminder = EKReminder(eventStore: eventStore)
        reminder.calendar = eventStore.defaultCalendarForNewReminders()
        if let calendarId = details.calendarId {
          let calendar = eventStore.calendar(withIdentifier: calendarId)
          if let calendar {
            if calendar.allowedEntityTypes.isDisjoint(with: .reminder) {
              throw InvalidCalendarType((calendarId, "reminder"))
            }
          } else {
            throw CalendarIdNotFoundException(calendarId)
          }

          reminder.calendar = calendar
        }
      }

      reminder.title = details.title
      reminder.location = details.location
      reminder.notes = details.notes
      if let timeZone = details.timeZone {
        let eventTimeZone = TimeZone(identifier: timeZone)
        if let eventTimeZone {
          reminder.timeZone = eventTimeZone
        } else {
          throw InvalidTimeZoneException()
        }
      }

      if let alarms = details.alarms {
        reminder.alarms = createCalendarEventAlarms(alarms: alarms)
      }

      if let recurrenceRule = details.recurrenceRule {
        let rule = createRecurrenceRule(rule: recurrenceRule)
        if let rule {
          reminder.recurrenceRules = [rule]
        }
      }

      if let urlString = details.url?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed), let url = URL(string: urlString) {
        reminder.url = url
      }

      if let startDate {
        let startDateComponents = currentCalendar.dateComponents([.year, .month, .day, .hour, .minute, . second], from: startDate)
        reminder.startDateComponents = startDateComponents
      }

      if let dueDate {
        let dueDateComponents = currentCalendar.dateComponents([.year, .month, .day, .hour, .minute, . second], from: dueDate)
        reminder.dueDateComponents = dueDateComponents
      }

      if let completionDate {
        reminder.completionDate = completionDate
      }

      try eventStore.save(reminder, commit: true)
      return reminder.calendarItemIdentifier
    }

    AsyncFunction("deleteReminderAsync") { (reminderId: String) in
      try checkRemindersPermissions()

      let reminder = eventStore.calendarItem(withIdentifier: reminderId)
      if let reminder = reminder as? EKReminder {
        try eventStore.remove(reminder, commit: true)
      } else {
        throw ReminderNotFoundException(reminderId)
      }
    }

    AsyncFunction("getSourcesAsync") {
      return eventStore.sources.map { source in
        serialize(ekSource: source)
      }
    }

    AsyncFunction("getSourceByIdAsync") { (sourceId: String) -> [String: Any?] in
      let source = eventStore.source(withIdentifier: sourceId)

      guard let source else {
        throw SourceNotFoundException(sourceId)
      }

      return serialize(ekSource: source)
    }

    AsyncFunction("getCalendarPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.getPermissionUsingRequesterClass(CalendarPermissionsRequester.self, resolve: promise.resolver, reject: promise.legacyRejecter)
    }

    AsyncFunction("requestCalendarPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.askForPermission(usingRequesterClass: CalendarPermissionsRequester.self, resolve: promise.resolver, reject: promise.legacyRejecter)
    }

    AsyncFunction("getRemindersPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.getPermissionUsingRequesterClass(RemindersPermissionRequester.self, resolve: promise.resolver, reject: promise.legacyRejecter)
    }

    AsyncFunction("requestRemindersPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.askForPermission(usingRequesterClass: RemindersPermissionRequester.self, resolve: promise.resolver, reject: promise.legacyRejecter)
    }
  }

  private func initializePermittedEntities() {
    guard let permissionsManager = appContext?.permissions else {
      return
    }
    var permittedEntities: EKEntityMask = []
    if permissionsManager.hasGrantedPermission(usingRequesterClass: CalendarPermissionsRequester.self) {
      permittedEntities.insert(.event)
    }

    if permissionsManager.hasGrantedPermission(usingRequesterClass: RemindersPermissionRequester.self) {
      permittedEntities.insert(.reminder)
    }

    self.permittedEntities = permittedEntities
  }

  private func checkCalendarPermissions() throws {
    try self.checkPermissions(entity: .event)
  }

  private func checkRemindersPermissions() throws {
    try self.checkPermissions(entity: .reminder)
  }

  private func checkPermissions(entity: EKEntityType) throws {
    guard let permissionsManager = appContext?.permissions else {
      throw PermissionsManagerNotFoundException()
    }

    var requester: AnyClass?
    switch entity {
    case .event:
      requester = CalendarPermissionsRequester.self
    case .reminder:
      requester = RemindersPermissionRequester.self
    }
    if let requester, !permissionsManager.hasGrantedPermission(usingRequesterClass: requester) {
      let message = requester.permissionType().uppercased()
      throw MissionPermissionsException(message)
    }

    resetEventStoreIfPermissionWasChanged(entity: entity)
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

  func resetEventStoreIfPermissionWasChanged(entity: EKEntityType) {
    if entity == .event {
      if permittedEntities.contains(.event) {
        return
      }
    } else if entity == .reminder {
      if permittedEntities.contains(.reminder) {
        return
      }
    }

    eventStore.reset()
    permittedEntities.insert(entity == .event ? .event : .reminder)
  }

  private func createCalendarEventAlarms(alarms: [Alarm]) -> [EKAlarm] {
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

  private func createCalendarEventAlarm(alarm: Alarm) -> EKAlarm? {
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

  private func getEvent(with id: String, startDate: Date?) -> EKEvent? {
    guard let firstEvent = eventStore.calendarItem(withIdentifier: id) as? EKEvent else {
      return nil
    }

    guard let startDate, let calendar = firstEvent.calendar else {
      return firstEvent
    }

    if let firstEventStart = firstEvent.startDate, firstEventStart.compare(startDate) == .orderedSame {
      return firstEvent
    }

    let endDate = startDate.addingTimeInterval(2592000)
    let events = eventStore.events(matching: eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [calendar]))

    for event in events {
      if event.calendarItemIdentifier != id {
        break
      }
      if let eventStart = event.startDate, eventStart.compare(startDate) == .orderedSame {
        return event
      }
    }
    return nil
  }

  private func parse(date: String?) -> Date? {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "UTC")

    guard let date else {
      return nil
    }
    return formatter.date(from: date)
  }

  private func createRecurrenceRule(rule: RecurrenceRule) -> EKRecurrenceRule? {
    let validFrequencyTypes = ["daily", "weekly", "monthly", "yearly"]
    guard !validFrequencyTypes.contains(rule.frequency) else {
      return nil
    }
    var endDate = parse(date: rule.endDate)

    var daysOfTheWeek: [EKRecurrenceDayOfWeek]?

    let daysOfTheMonth = rule.daysOfTheMonth?.map {
      NSNumber(integerLiteral: $0)
    }
    let monthsOfTheYear = rule.monthsOfTheYear?.map {
      NSNumber(integerLiteral: $0.rawValue)
    }
    let weeksOfTheYear = rule.weeksOfTheYear?.map {
      NSNumber(integerLiteral: $0)
    }
    let daysOfTheYear = rule.daysOfTheYear?.map {
      NSNumber(integerLiteral: $0)
    }
    let setPositions = rule.setPositions?.map {
      NSNumber(integerLiteral: $0)
    }

    if let days = rule.daysOfTheWeek {
      for item in days {
        daysOfTheWeek?.append(EKRecurrenceDayOfWeek(item.dayOfTheWeek.toEKType(), weekNumber: item.weekNumber))
      }
    }

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

    let recurrenceRule = EKRecurrenceRule(recurrenceWith: recurrenceFrequency(name: rule.frequency), interval: recurrenceInterval, daysOfTheWeek: daysOfTheWeek, daysOfTheMonth: daysOfTheMonth, monthsOfTheYear: monthsOfTheYear, weeksOfTheYear: weeksOfTheYear, daysOfTheYear: daysOfTheYear, setPositions: setPositions, end: recurrenceEnd)

    return recurrenceRule
  }

  private func recurrenceFrequency(name: String) -> EKRecurrenceFrequency {
    switch name {
    case "weekly":
      return .weekly
    case "monthly":
      return .monthly
    case "yearly":
      return .yearly
    default:
      return .daily
    }
  }
}
