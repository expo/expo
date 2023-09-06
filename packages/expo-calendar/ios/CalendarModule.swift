import ExpoModulesCore
import CoreLocation
import EventKit

public class CalendarModule: Module {
  private var permittedEntities: EKEntityMask = .event
  private var eventStore = EKEventStore()
  private lazy var formatter: DateFormatter = {
    let df = DateFormatter()
    df.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"
    df.locale = Locale(identifier: "en_US_POSIX")
    df.timeZone = TimeZone(identifier: "UTC")
    return df
  }()

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

        for calendar in deviceCalendars where calendarIds.contains(calendar.calendarIdentifier) {
          eventCalendars.append(calendar)
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
      throw EventNotFoundException(eventId)
    }

    AsyncFunction("saveEventAsync") { (event: Event, options: RecurringEventOptions) -> String? in
      try checkCalendarPermissions()
      var calendarEvent: EKEvent?
      let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent

      if let id = event.id {
        guard let event = getEvent(with: id, startDate: parse(date: event.instanceStartDate)) else {
          throw EventNotFoundException(id)
        }
        calendarEvent = event
      } else {
        guard let calendarId = event.calendarId else {
          throw CalendarIdRequiredException()
        }
        let calendar = eventStore.calendar(withIdentifier: calendarId)
        guard let calendar else {
          throw CalendarIdNotFoundException(calendarId)
        }

        if calendar.allowedEntityTypes.isDisjoint(with: [.event]) {
          throw InvalidCalendarTypeException((calendarId, "event"))
        }

        calendarEvent = EKEvent(eventStore: eventStore)
        calendarEvent?.calendar = calendar
      }

      calendarEvent?.title = event.title
      calendarEvent?.location = event.location
      calendarEvent?.notes = event.notes

      if let timeZone = event.timeZone {
        if let tz = TimeZone(identifier: timeZone) {
          calendarEvent?.timeZone = tz
        } else {
          throw InvalidTimeZoneException()
        }
      }

      calendarEvent?.alarms = createCalendarEventAlarms(alarms: event.alarms)
      if let rule = event.recurrenceRule {
        let newRule = createRecurrenceRule(rule: rule)

        if let newRule {
          calendarEvent?.recurrenceRules = [newRule]
        }
      }

      if let urlString = event.url?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed), let url = URL(string: urlString) {
        calendarEvent?.url = url
      }

      calendarEvent?.startDate = parse(date: event.startDate)
      calendarEvent?.endDate = parse(date: event.endDate)
      calendarEvent?.isAllDay = event.allDay
      calendarEvent?.availability = getAvailability(availability: event.availability)

      if let calendarEvent {
        try eventStore.save(calendarEvent, span: span, commit: true)
        return calendarEvent.calendarItemIdentifier
      }
      return nil
    }

    AsyncFunction("deleteEventAsync") { (event: Event, options: RecurringEventOptions) in
      try checkCalendarPermissions()
      guard let id = event.id else {
        throw EventIdRequiredException()
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
        throw EventIdRequiredException()
      }
      let instanceStartDate = parse(date: event.instanceStartDate)

      let item = getEvent(with: id, startDate: instanceStartDate)

      if let item {
        if let attendees = item.attendees {
          return serialize(attendees: attendees)
        }
      }
      return []
    }

    AsyncFunction("getRemindersAsync") { (startDateStr: String, endDateStr: String, calendarIds: [String], status: String?, promise: Promise) in
      try checkRemindersPermissions()
      var reminderCalendars: [EKCalendar]?
      let startDate = parse(date: startDateStr)
      let endDate = parse(date: endDateStr)

      if !calendarIds.isEmpty {
        reminderCalendars = []
        let deviceCalendars = eventStore.calendars(for: .reminder)

        for calendar in deviceCalendars where calendarIds.contains(calendar.calendarIdentifier) {
          reminderCalendars?.append(calendar)
        }
      } else {
        promise.reject(MissingParameterException())
        return
      }

      let predicate: NSPredicate = {
        if let status {
          if status == "incomplete" {
            return eventStore.predicateForIncompleteReminders(
              withDueDateStarting: startDate,
              ending: endDate,
              calendars: reminderCalendars
            )
          } else if status == "completed" {
            return eventStore.predicateForCompletedReminders(
              withCompletionDateStarting: startDate,
              ending: endDate,
              calendars: reminderCalendars
            )
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
      }
      throw ReminderNotFoundException(reminderId)
    }

    AsyncFunction("saveReminderAsync") { (details: Reminder) -> String  in
      try checkRemindersPermissions()
      var reminder: EKReminder
      let startDate = parse(date: details.startDate)
      let dueDate = parse(date: details.dueDate)
      let completionDate = parse(date: details.completionDate)

      let currentCalendar = Calendar.current

      if let reminderId = details.id {
        guard let reminderWithId = eventStore.calendarItem(withIdentifier: reminderId) as? EKReminder else {
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
              throw InvalidCalendarTypeException((calendarId, "reminder"))
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
        let startDateComponents = currentCalendar.dateComponents(
          [.year, .month, .day, .hour, .minute, . second],
          from: startDate
        )
        reminder.startDateComponents = startDateComponents
      }

      if let dueDate {
        let dueDateComponents = currentCalendar.dateComponents(
          [.year, .month, .day, .hour, .minute, . second],
          from: dueDate
        )
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
      let source = eventStore.source(withIdentifier: sourceId)

      guard let source else {
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

  private func parse(date: String?) -> Date? {
    guard let date else {
      return nil
    }
    
    if let date = Int(date) {
      return Date(timeIntervalSince1970: TimeInterval(date))
    }
    
    return formatter.date(from: date)
  }

  private func createRecurrenceRule(rule: RecurrenceRule) -> EKRecurrenceRule? {
    guard ["daily", "weekly", "monthly", "yearly"].contains(rule.frequency) else {
      return nil
    }
    var endDate = parse(date: rule.endDate)

    let daysOfTheWeek = rule.daysOfTheWeek?.map { day in
      EKRecurrenceDayOfWeek(day.dayOfTheWeek.toEKType(), weekNumber: day.weekNumber)
    }

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
      recurrenceWith: recurrenceFrequency(name: rule.frequency),
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
