import ExpoModulesCore
import CoreLocation
import EventKit

public class CalendarModule: Module {
  private var permittedEntities: EKEntityMask = .event
  private var eventStore = EKEventStore()

  // swiftlint:disable:next cyclomatic_complexity
  public func definition() -> ModuleDefinition {
    Name("ExpoCalendar")

    OnCreate {
      self.appContext?.permissions?.register([
        CalendarPermissionsRequester(eventStore: eventStore),
        RemindersPermissionRequester(eventStore: eventStore)
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
      guard let defaultCalendar = eventStore.defaultCalendarForNewEvents else {
        throw DefaultCalendarNotFoundException()
      }
      return serializeCalendar(calendar: defaultCalendar)
    }

    AsyncFunction("saveCalendarAsync") { (details: CalendarRecord) -> String in
      switch details.entityType {
      case .event:
        try checkCalendarPermissions()
      case .reminder:
        try checkRemindersPermissions()
      case .none:
        break
      }

      let calendar = try getCalendar(from: details)
      try eventStore.saveCalendar(calendar, commit: true)
      return calendar.calendarIdentifier
    }

    AsyncFunction("deleteCalendarAsync") { (calendarId: String) in
      try checkCalendarPermissions()
      let calendar = eventStore.calendar(withIdentifier: calendarId)

      guard let calendar else {
        throw CalendarIdNotFoundException(calendarId)
      }
      try eventStore.removeCalendar(calendar, commit: true)
    }

    AsyncFunction("getEventsAsync") { (startDateStr: Either<String, Double>, endDateStr: Either<String, Double>, calendarIds: [String]) -> [[String: Any?]] in
      try checkCalendarPermissions()

      guard let startDate = parse(date: startDateStr),
        let endDate = parse(date: endDateStr) else {
        throw InvalidDateFormatException()
      }

      var eventCalendars = [EKCalendar]()
      if !calendarIds.isEmpty {
        let deviceCalendars = eventStore.calendars(for: .event)

        for calendar in deviceCalendars where calendarIds.contains(calendar.calendarIdentifier) {
          eventCalendars.append(calendar)
        }
      }

      let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: eventCalendars)

      let calendarEvents = eventStore.events(matching: predicate).sorted {
        $0.startDate.compare($1.startDate) == .orderedAscending
      }

      return serializeCalendar(events: calendarEvents)
    }

    AsyncFunction("getEventByIdAsync") { (eventId: String, startDateStr: Either<String, Double>?) -> [String: Any?] in
      try checkCalendarPermissions()
      let startDate = parse(date: startDateStr)
      guard let calendarEvent = getEvent(with: eventId, startDate: startDate) else {
        throw EventNotFoundException(eventId)
      }
      return serializeCalendar(event: calendarEvent)
    }

    AsyncFunction("saveEventAsync") { (event: Event, options: RecurringEventOptions) -> String in
      try checkCalendarPermissions()
      let calendarEvent = try getCalendar(from: event)
      let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent

      if let timeZone = event.timeZone {
        if let tz = TimeZone(identifier: timeZone) {
          calendarEvent.timeZone = tz
        } else {
          throw InvalidTimeZoneException(timeZone)
        }
      }

      calendarEvent.alarms = createCalendarEventAlarms(alarms: event.alarms)
      if let rule = event.recurrenceRule {
        let newRule = createRecurrenceRule(rule: rule)
        if let newRule {
          calendarEvent.recurrenceRules = [newRule]
        }
      }

      if let url = maybeSetUrl(event.url) {
        calendarEvent.url = url
      }

      if let startDate = event.startDate {
        calendarEvent.startDate = parse(date: startDate)
      }
      if let endDate = event.endDate {
        calendarEvent.endDate = parse(date: endDate)
      }

      calendarEvent.title = event.title
      calendarEvent.location = event.location
      calendarEvent.notes = event.notes
      calendarEvent.isAllDay = event.allDay
      calendarEvent.availability = getAvailability(availability: event.availability)

      try eventStore.save(calendarEvent, span: span, commit: true)
      return calendarEvent.calendarItemIdentifier
    }

    AsyncFunction("deleteEventAsync") { (event: Event, options: RecurringEventOptions) in
      try checkCalendarPermissions()
      guard let id = event.id else {
        throw EventIdRequiredException()
      }
      let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent

      let instanceStartDate = parse(date: event.instanceStartDate)
      let calendarEvent = getEvent(with: id, startDate: instanceStartDate)

      guard let calendarEvent else {
        return
      }
      try eventStore.remove(calendarEvent, span: span)
    }

    AsyncFunction("getAttendeesForEventAsync") { (event: Event) -> [[String: Any?]] in
      try checkCalendarPermissions()
      guard let id = event.id else {
        throw EventIdRequiredException()
      }
      let instanceStartDate = parse(date: event.instanceStartDate)

      let item = getEvent(with: id, startDate: instanceStartDate)

      guard let item, let attendees = item.attendees else {
        return []
      }

      return serialize(attendees: attendees)
    }

    AsyncFunction("getRemindersAsync") { (startDateStr: String, endDateStr: String, calendarIds: [String?], status: String?, promise: Promise) in
      try checkRemindersPermissions()
      var reminderCalendars = [EKCalendar]()
      let startDate = parse(date: startDateStr)
      let endDate = parse(date: endDateStr)

      let ids = calendarIds.compactMap { $0 }

      let deviceCalendars = eventStore.calendars(for: .reminder)
      if !ids.isEmpty {
        for calendar in deviceCalendars where calendarIds.contains(calendar.calendarIdentifier) {
          reminderCalendars.append(calendar)
        }
      } else {
        reminderCalendars = deviceCalendars
      }

      let predicate = try createPredicate(for: reminderCalendars, start: startDate, end: endDate, status: status)
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

      guard let reminder else {
        throw ReminderNotFoundException(reminderId)
      }
      return serialize(reminder)
    }

    // swiftlint:disable:next closure_body_length
    AsyncFunction("saveReminderAsync") { (details: Reminder) -> String  in
      try checkRemindersPermissions()
      let reminder = try getReminder(from: details)
      let startDate = parse(date: details.startDate)
      let dueDate = parse(date: details.dueDate)
      let completionDate = parse(date: details.completionDate)

      if let timeZone = details.timeZone {
        if let eventTimeZone = TimeZone(identifier: timeZone) {
          reminder.timeZone = eventTimeZone
        } else {
          throw InvalidTimeZoneException(timeZone)
        }
      }

      if let alarms = details.alarms {
        reminder.alarms = createCalendarEventAlarms(alarms: alarms)
      }

      if let recurrenceRule = details.recurrenceRule {
        if let rule = createRecurrenceRule(rule: recurrenceRule) {
          reminder.recurrenceRules = [rule]
        }
      }

      if let url = maybeSetUrl(details.url) {
        reminder.url = url
      }

      if let startDate {
        reminder.startDateComponents = createDateComponents(for: startDate)
      }

      if let dueDate {
        reminder.dueDateComponents = createDateComponents(for: dueDate)
      }

      if let completionDate {
        reminder.completionDate = completionDate
      }

      if let notes = details.notes {
        reminder.notes = notes
      }

      if let isCompleted = details.completed {
        reminder.isCompleted = isCompleted
      }

      reminder.title = details.title
      reminder.location = details.location

      try eventStore.save(reminder, commit: true)
      return reminder.calendarItemIdentifier
    }

    AsyncFunction("deleteReminderAsync") { (reminderId: String) in
      try checkRemindersPermissions()
      guard let reminder = eventStore.calendarItem(withIdentifier: reminderId) as? EKReminder else {
        throw ReminderNotFoundException(reminderId)
      }
      try eventStore.remove(reminder, commit: true)
    }

    AsyncFunction("getSourcesAsync") {
      return eventStore.sources.map { source in
        serialize(ekSource: source)
      }
    }

    AsyncFunction("getSourceByIdAsync") { (sourceId: String) -> [String: Any?] in
      guard let source = eventStore.source(withIdentifier: sourceId) else {
        throw SourceNotFoundException(sourceId)
      }
      return serialize(ekSource: source)
    }

    AsyncFunction("getCalendarPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.getPermissionUsingRequesterClass(
        CalendarPermissionsRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestCalendarPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.askForPermission(
        usingRequesterClass: CalendarPermissionsRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getRemindersPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.getPermissionUsingRequesterClass(
        RemindersPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestRemindersPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.askForPermission(
        usingRequesterClass: RemindersPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter)
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

  func resetEventStoreIfPermissionWasChanged(entity: EKEntityType) {
    // looks redundant but these are different types.
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

  private func maybeSetUrl(_ url: String?) -> URL? {
    if let urlString = url?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed), let url = URL(string: urlString) {
      return url
    }
    return nil
  }

  private func getReminder(from details: Reminder) throws -> EKReminder {
    if let reminderId = details.id {
      guard let reminderWithId = eventStore.calendarItem(withIdentifier: reminderId) as? EKReminder else {
        throw ReminderNotFoundException(reminderId)
      }

      reminderWithId.title = details.title
      reminderWithId.location = details.location
      reminderWithId.notes = details.notes

      return reminderWithId
    }
    let reminder = EKReminder(eventStore: eventStore)
    reminder.calendar = eventStore.defaultCalendarForNewReminders()

    if let calendarId = details.calendarId {
      let calendar = eventStore.calendar(withIdentifier: calendarId)
      if let calendar {
        if calendar.allowedEntityTypes.isDisjoint(with: .reminder) {
          throw InvalidCalendarTypeException((calendarId, "reminder"))
        }
      } else {
        throw CalendarIdNotFoundException(calendarId)
      }
      reminder.calendar = calendar
    }
    reminder.title = details.title
    reminder.location = details.location
    reminder.notes = details.notes

    return reminder
  }

  private func getCalendar(from record: CalendarRecord) throws -> EKCalendar {
    if let id = record.id {
      guard let calendar = eventStore.calendar(withIdentifier: id) else {
        throw CalendarIdNotFoundException(id)
      }

      if calendar.isImmutable == true {
        throw CalendarNotSavedException(record.title)
      }
      calendar.title = record.title
      calendar.cgColor = EXUtilities.uiColor(record.color)?.cgColor
      return calendar
    }
    let calendar: EKCalendar
    if record.entityType == .event {
      calendar = .init(for: .event, eventStore: eventStore)
    } else if record.entityType == .reminder {
      calendar = .init(for: .reminder, eventStore: eventStore)
    } else {
      throw EntityNotSupportedException(record.entityType?.rawValue)
    }

    if let sourceId = record.sourceId {
      calendar.source = eventStore.source(withIdentifier: sourceId)
    } else {
      calendar.source = record.entityType == .event ?
      eventStore.defaultCalendarForNewEvents?.source :
      eventStore.defaultCalendarForNewReminders()?.source
    }

    calendar.title = record.title
    calendar.cgColor = EXUtilities.uiColor(record.color)?.cgColor

    return calendar
  }

  private func getCalendar(from event: Event) throws -> EKEvent {
    if let id = event.id {
      guard let event = getEvent(with: id, startDate: parse(date: event.instanceStartDate)) else {
        throw EventNotFoundException(id)
      }
      return event
    }
    guard let calendarId = event.calendarId else {
      throw CalendarIdRequiredException()
    }
    guard let calendar = eventStore.calendar(withIdentifier: calendarId) else {
      throw CalendarIdNotFoundException(calendarId)
    }

    if calendar.allowedEntityTypes.isDisjoint(with: [.event]) {
      throw InvalidCalendarTypeException((calendarId, "event"))
    }

    let calendarEvent = EKEvent(eventStore: eventStore)
    calendarEvent.calendar = calendar
    calendarEvent.title = event.title
    calendarEvent.location = event.location
    calendarEvent.notes = event.notes

    return calendarEvent
  }

  private func getEvent(with id: String, startDate: Date?) -> EKEvent? {
    guard let firstEvent = eventStore.calendarItem(withIdentifier: id) as? EKEvent else {
      return nil
    }

    guard let startDate else {
      return firstEvent
    }

    guard let firstEventStart = firstEvent.startDate, firstEventStart.compare(startDate) == .orderedSame else {
      return firstEvent
    }

    let endDate = startDate.addingTimeInterval(2_592_000)
    let events = eventStore.events(
      matching: eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [firstEvent.calendar])
    )

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

  private func createPredicate(for calendars: [EKCalendar], start startDate: Date?, end endDate: Date?, status: String?) throws -> NSPredicate {
    guard let status else {
      return eventStore.predicateForReminders(in: calendars)
    }
    switch status {
    case "incomplete":
      return eventStore.predicateForIncompleteReminders(
        withDueDateStarting: startDate,
        ending: endDate,
        calendars: calendars
      )
    case "completed":
      return eventStore.predicateForCompletedReminders(
        withCompletionDateStarting: startDate,
        ending: endDate,
        calendars: calendars
      )
    default:
      throw InvalidStatusExceptions(status)
    }
  }
}
