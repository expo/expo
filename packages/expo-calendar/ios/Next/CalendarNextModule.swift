import EventKit
import EventKitUI
import ExpoModulesCore
import Foundation

// swiftlint:disable closure_parameter_position
public final class CalendarNextModule: Module {
  private var permittedEntities: EKEntityMask = .event
  private var eventStore: EKEventStore {
    return CalendarModule.sharedEventStore
  }

  private var calendarDialogDelegate: CalendarDialogDelegate?

  public func definition() -> ModuleDefinition {
    Name("CalendarNext")

    OnCreate {
      self.appContext?.permissions?.register([
        CalendarPermissionsRequester(eventStore: eventStore),
        RemindersPermissionRequester(eventStore: eventStore)
      ])
      initializePermittedEntities()
    }

    Function("getDefaultCalendar") { () -> ExpoCalendar in
      try checkCalendarPermissions()
      guard let defaultCalendar = eventStore.defaultCalendarForNewEvents else {
        throw DefaultCalendarNotFoundException()
      }
      return ExpoCalendar(calendar: defaultCalendar)
    }

    Function("getCalendars") { (type: CalendarEntity?) -> [ExpoCalendar] in
      let calendars: [EKCalendar]
      switch type {
      case nil:
        try checkCalendarPermissions()
        try checkRemindersPermissions()
        calendars = eventStore.calendars(for: .event) + eventStore.calendars(for: .reminder)
      case .event:
        try checkCalendarPermissions()
        calendars = eventStore.calendars(for: .event)
      case .reminder:
        try checkRemindersPermissions()
        calendars = eventStore.calendars(for: .reminder)
      default:
        throw InvalidCalendarEntityException(type?.rawValue)
      }
      return calendars.map { ExpoCalendar(calendar: $0) }
    }

    Function("createCalendarNext") { (calendarRecord: CalendarRecordNext) throws -> ExpoCalendar in
      let calendar: EKCalendar
      switch calendarRecord.entityType {
      case .event:
        try checkCalendarPermissions()
        calendar = EKCalendar(for: .event, eventStore: eventStore)
      case .reminder:
        try checkRemindersPermissions()
        calendar = EKCalendar(for: .reminder, eventStore: eventStore)
      case .none:
        throw EntityNotSupportedException(calendarRecord.entityType?.rawValue)
      }

      guard let title = calendarRecord.title else {
        throw MissingParameterException("title")
      }

      if let sourceId = calendarRecord.sourceId {
        calendar.source = eventStore.source(withIdentifier: sourceId)
      } else {
        calendar.source =
        calendarRecord.entityType == .event
        ? eventStore.defaultCalendarForNewEvents?.source
        : eventStore.defaultCalendarForNewReminders()?.source
      }

      calendar.title = title
      calendar.cgColor = calendarRecord.color?.cgColor

      try eventStore.saveCalendar(calendar, commit: true)
      return ExpoCalendar(calendar: calendar)
    }

    AsyncFunction("listEvents") {
      ( calendarIds: [String],
        startDateStr: Either<String, Double>,
        endDateStr: Either<String, Double>,
        promise: Promise) throws in
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

      promise.resolve(calendarEvents.map { ExpoCalendarEvent(event: $0) })
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

    Function("getSources") {
      return eventStore.sources.map { source in
        serialize(ekSource: source)
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(ExpoCalendar.self) {
      Constructor { (id: String) in
        ExpoCalendar(id: id)
      }

      Property("id") { (expoCalendar: ExpoCalendar) in
        expoCalendar.calendar?.calendarIdentifier
      }

      Property("title") { (expoCalendar: ExpoCalendar) in
        expoCalendar.calendar?.title
      }

      Property("source") { (expoCalendar: ExpoCalendar) -> [String: Any?] in
        guard let calendar = expoCalendar.calendar else {
          return [:]
        }
        return serialize(ekSource: calendar.source)
      }

      Property("sourceId") { (expoCalendar: ExpoCalendar) -> String? in
        guard let calendar = expoCalendar.calendar else {
          return nil
        }
        return calendar.source.sourceIdentifier
      }

      Property("type") { (expoCalendar: ExpoCalendar) -> String? in
        guard let calendar = expoCalendar.calendar else {
          return nil
        }
        return calendarTypeToString(type: calendar.type, source: calendar.source.sourceType)
      }

      Property("color") { (expoCalendar: ExpoCalendar) -> String? in
        guard let cgColor = expoCalendar.calendar?.cgColor else {
          return nil
        }
        return EXUtilities.hexString(with: cgColor)
      }

      Property("entityType") { (expoCalendar: ExpoCalendar) -> String? in
        guard let calendar = expoCalendar.calendar else {
          return nil
        }
        return entity(type: calendar.allowedEntityTypes)
      }

      Property("allowsModifications") { (expoCalendar: ExpoCalendar) -> Bool in
        guard let calendar = expoCalendar.calendar else {
          return false
        }
        return calendar.allowsContentModifications
      }

      Property("allowedAvailabilities") { (expoCalendar: ExpoCalendar) -> [String] in
        guard let calendar = expoCalendar.calendar else {
          return []
        }
        return calendarSupportedAvailabilities(
          fromMask: calendar.supportedEventAvailabilities)
      }

      AsyncFunction("listEvents") {
        (expoCalendar: ExpoCalendar,
        startDateStr: Either<String, Double>,
        endDateStr: Either<String, Double>,
        promise: Promise) throws in
        try checkCalendarPermissions()

        guard let startDate = parse(date: startDateStr),
          let endDate = parse(date: endDateStr)
        else {
          throw InvalidDateFormatException()
        }

        promise.resolve(try expoCalendar.listEvents(startDate: startDate, endDate: endDate))
      }

      AsyncFunction("listReminders") {
        ( calendar: ExpoCalendar,
          startDateStr: String?,
          endDateStr: String?,
          status: String?,
          promise: Promise) throws in
        try checkRemindersPermissions()

        var startDate: Date?
        var endDate: Date?

        if let startDateStr = startDateStr {
          guard let parsedStartDate = parse(date: startDateStr) else {
            throw InvalidDateFormatException()
          }
          startDate = parsedStartDate
        }

        if let endDateStr = endDateStr {
          guard let parsedEndDate = parse(date: endDateStr) else {
            throw InvalidDateFormatException()
          }
          endDate = parsedEndDate
        }

        return calendar.listReminders(startDate: startDate, endDate: endDate, status: status, promise: promise)
      }

      // swiftlint:enable closure_parameter_position
      Function("createEvent") { (expoCalendar: ExpoCalendar, eventRecord: EventNext, options: RecurringEventOptions?) -> ExpoCalendarEvent in
        try checkCalendarPermissions()

        guard let calendar = expoCalendar.calendar else {
          throw CalendarNoLongerExistsException()
        }

        if eventRecord.title == nil {
          throw MissingParameterException("title")
        }

        let expoCalendarEvent = try ExpoCalendarEvent(calendar: calendar, eventRecord: eventRecord)

        try expoCalendarEvent.initialize(eventRecord: eventRecord)

        let span: EKSpan = options?.futureEvents == true ? .futureEvents : .thisEvent

        guard let ekEvent = expoCalendarEvent.event else {
          throw EventNotFoundException("Expo event could not be created")
        }

        try eventStore.save(ekEvent, span: span, commit: true)

        return expoCalendarEvent
      }

      Function("createReminder") { (expoCalendar: ExpoCalendar, reminderRecord: Reminder, _: RecurringEventOptions?) -> ExpoCalendarReminder in
        try checkRemindersPermissions()

        guard let calendarInstance = expoCalendar.calendar else {
          throw CalendarNoLongerExistsException()
        }

        if reminderRecord.title == nil {
          throw MissingParameterException("title")
        }

        let expoReminder = try ExpoCalendarReminder(calendar: calendarInstance, reminderRecord: reminderRecord)
        try expoReminder.initialize(reminderRecord: reminderRecord)

        guard let reminder = expoReminder.reminder else {
          throw Exception()
        }

        try eventStore.save(reminder, commit: true)
        return expoReminder
      }

      Function("update") { (expoCalendar: ExpoCalendar, calendarRecord: CalendarRecordNext) throws in
        try checkCalendarPermissions()
        try expoCalendar.update(calendarRecord: calendarRecord)
      }

      Function("delete") { (expoCalendar: ExpoCalendar) in
        try checkCalendarPermissions()
        try expoCalendar.delete()
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(ExpoCalendarEvent.self) {
      Property("id") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.calendarItemIdentifier
      }

      Property("calendarId") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.calendar.calendarIdentifier
      }

      Property("title") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.title
      }

      Property("location") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.location
      }

      Property("creationDate") { (expoEvent: ExpoCalendarEvent) in
        dateFormatter.string(from: expoEvent.event?.creationDate ?? Date())
      }

      Property("lastModifiedDate") { (expoEvent: ExpoCalendarEvent) in
        dateFormatter.string(from: expoEvent.event?.lastModifiedDate ?? Date())
      }

      Property("timeZone") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.timeZone?.localizedName(for: .shortStandard, locale: .current)
      }

      Property("url") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.url?.absoluteString.removingPercentEncoding
      }

      Property("notes") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.notes
      }

      Property("alarms") { (expoEvent: ExpoCalendarEvent) -> [[String: Any?]]? in
        expoEvent.serializeAlarms()
      }

      Property("recurrenceRule") { (expoEvent: ExpoCalendarEvent) -> [String: Any?]? in
        expoEvent.serializeRecurrenceRule()
      }

      Property("startDate") { (expoEvent: ExpoCalendarEvent) -> String? in
        guard let startDate = expoEvent.event?.startDate else {
          return nil
        }
        return dateFormatter.string(from: startDate)
      }

      Property("endDate") { (expoEvent: ExpoCalendarEvent) -> String? in
        guard let endDate = expoEvent.event?.endDate else {
          return nil
        }
        return dateFormatter.string(from: endDate)
      }

      Property("originalStartDate") { (expoEvent: ExpoCalendarEvent) -> String? in
        guard let occurrenceDate = expoEvent.event?.occurrenceDate else {
          return nil
        }
        return dateFormatter.string(from: occurrenceDate)
      }

      Property("isDetached") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.isDetached ?? false
      }

      Property("allDay") { (expoEvent: ExpoCalendarEvent) in
        expoEvent.event?.isAllDay ?? false
      }

      Property("availability") { (expoEvent: ExpoCalendarEvent) -> String? in
        guard let availability = expoEvent.event?.availability else {
          return nil
        }
        return eventAvailabilityToString(availability)
      }

      Property("status") { (expoEvent: ExpoCalendarEvent) in
        eventStatusToString(expoEvent.event?.status ?? .none)
      }

      Property("organizer") { (expoEvent: ExpoCalendarEvent) -> [String: Any?]? in
        guard let organizer = expoEvent.event?.organizer else {
          return nil
        }
        return serialize(attendee: organizer)
      }

      AsyncFunction("openInCalendarAsync") {(expoEvent: ExpoCalendarEvent, options: OpenInCalendarOptions?, promise: Promise) in
        try checkCalendarPermissions()

        let startDate = parse(date: options?.instanceStartDate)
        guard let calendarEvent = expoEvent.getOccurrence(startDate: startDate) else {
          throw ItemNoLongerExistsException()
        }

        guard let currentVc = appContext?.utilities?.currentViewController() else {
          throw Exception()
        }
        warnIfDialogInProgress()

        let controller = EKEventViewController()
        controller.event = calendarEvent
        controller.allowsEditing = options?.allowsEditing == true
        controller.allowsCalendarPreview = options?.allowsCalendarPreview == true
        self.calendarDialogDelegate = CalendarDialogDelegate(promise: promise, onComplete: self.unsetDelegate)
        controller.delegate = self.calendarDialogDelegate
        let navController = ViewEventViewController(rootViewController: controller, promise: promise, onDismiss: self.unsetDelegate)
        currentVc.present(navController, animated: true)
      }.runOnQueue(.main)

      AsyncFunction("editInCalendarAsync") { (expoEvent: ExpoCalendarEvent, _: OpenInCalendarOptions?, promise: Promise) in
        try checkCalendarPermissions()

        print("editInCalendarAsync")
        warnIfDialogInProgress()

        guard let event = expoEvent.event else {
          throw ItemNoLongerExistsException()
        }

        try presentEventEditViewController(event: event, promise: promise)
      }.runOnQueue(.main)

      Function("getOccurrence") { (expoEvent: ExpoCalendarEvent, options: RecurringEventOptions?) throws in
        try checkCalendarPermissions()
        guard let ekEvent = try expoEvent.getOccurrence(options: options) else {
          throw EventNotFoundException(options?.instanceStartDate ?? "")
        }
        return ExpoCalendarEvent(event: ekEvent)
      }

      AsyncFunction("getAttendees") { (expoEvent: ExpoCalendarEvent, options: RecurringEventOptions?, promise: Promise) throws in
        try checkCalendarPermissions()
        promise.resolve(try expoEvent.getAttendees(options: options))
      }

      Function("update") { (expoEvent: ExpoCalendarEvent, eventRecord: EventNext, options: RecurringEventOptions?, nullableFields: [String]?) throws in
        try checkCalendarPermissions()
        try expoEvent.update(eventRecord: eventRecord, options: options, nullableFields: nullableFields)
      }

      Function("delete") { (expoEvent: ExpoCalendarEvent, options: RecurringEventOptions) in
        try checkCalendarPermissions()
        try expoEvent.delete(options: options)
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(ExpoCalendarReminder.self) {
      Property("id") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.calendarItemIdentifier
      }

      Property("calendarId") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.calendar.calendarIdentifier
      }

      Property("title") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.title
      }

      Property("location") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.location
      }

      Property("creationDate") { (expoReminder: ExpoCalendarReminder) -> String? in
        guard let creationDate = expoReminder.reminder?.creationDate else {
          return nil
        }
        return dateFormatter.string(from: creationDate)
      }

      Property("lastModifiedDate") { (expoReminder: ExpoCalendarReminder) -> String? in
        guard let lastModifiedDate = expoReminder.reminder?.lastModifiedDate else {
          return nil
        }
        return dateFormatter.string(from: lastModifiedDate)
      }

      Property("timeZone") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.timeZone?.localizedName(for: .shortStandard, locale: .current)
      }

      Property("url") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.url?.absoluteString.removingPercentEncoding
      }

      Property("notes") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.notes
      }

      Property("alarms") { (expoReminder: ExpoCalendarReminder) -> [[String: Any?]]? in
        expoReminder.serializeAlarms()
      }

      Property("recurrenceRule") { (expoReminder: ExpoCalendarReminder) -> [String: Any?]? in
        expoReminder.serializeRecurrenceRule()
      }

      Property("startDate") { (expoReminder: ExpoCalendarReminder) -> String? in
        let currentCalendar = Calendar.current

        guard let startDateComponents = expoReminder.reminder?.startDateComponents else {
          return nil
        }

        guard let startDate = currentCalendar.date(from: startDateComponents) else {
          return nil
        }

        return dateFormatter.string(from: startDate)
      }

      Property("dueDate") { (expoReminder: ExpoCalendarReminder) -> String? in
        let currentCalendar = Calendar.current

        guard let dueDateComponents = expoReminder.reminder?.dueDateComponents else {
          return nil
        }

        guard let dueDate = currentCalendar.date(from: dueDateComponents) else {
          return nil
        }

        return dateFormatter.string(from: dueDate)
      }

      Property("completed") { (expoReminder: ExpoCalendarReminder) in
        expoReminder.reminder?.isCompleted ?? false
      }

      Property("completionDate") { (expoReminder: ExpoCalendarReminder) -> String? in
        guard let completionDate = expoReminder.reminder?.completionDate else {
          return nil
        }
        return dateFormatter.string(from: completionDate)
      }

      Function("update") { (expoReminder: ExpoCalendarReminder, reminderRecord: Reminder, nullableFields: [String]?) in
        try checkRemindersPermissions()
        try expoReminder.update(reminderRecord: reminderRecord, nullableFields: nullableFields)
      }

      Function("delete") { (expoReminder: ExpoCalendarReminder) in
        try checkRemindersPermissions()
        try expoReminder.delete()
      }
    }

    Class(ExpoCalendarAttendee.self) {
      Property("name") { (expoAttendee: ExpoCalendarAttendee) in
        expoAttendee.attendee.name
      }

      Property("isCurrentUser") { (expoAttendee: ExpoCalendarAttendee) in
        expoAttendee.attendee.isCurrentUser
      }

      Property("role") { (expoAttendee: ExpoCalendarAttendee) in
        participantToString(role: expoAttendee.attendee.participantRole)
      }

      Property("status") { (expoAttendee: ExpoCalendarAttendee) in
        participantStatusToString(status: expoAttendee.attendee.participantStatus)
      }

      Property("type") { (expoAttendee: ExpoCalendarAttendee) in
        participantTypeToString(type: expoAttendee.attendee.participantType)
      }

      Property("url") { (expoAttendee: ExpoCalendarAttendee) in
        expoAttendee.attendee.url.absoluteString.removingPercentEncoding
      }
    }
  }

  // TODO: Clean up, this is copied from CalendarModule
  private func initializePermittedEntities() {
    guard let permissionsManager = appContext?.permissions else {
      return
    }
    var permittedEntities: EKEntityMask = []
    if permissionsManager.hasGrantedPermission(
      usingRequesterClass: CalendarPermissionsRequester.self) {
      permittedEntities.insert(.event)
    }

    if permissionsManager.hasGrantedPermission(
      usingRequesterClass: RemindersPermissionRequester.self) {
      permittedEntities.insert(.reminder)
    }

    self.permittedEntities = permittedEntities
  }

  // TODO: Clean up, this is copied from CalendarModule
  private func checkCalendarPermissions() throws {
    try self.checkPermissions(entity: .event)
  }

  // TODO: Clean up, this is copied from CalendarModule
  private func checkRemindersPermissions() throws {
    try self.checkPermissions(entity: .reminder)
  }

  // TODO: Clean up, this is copied from CalendarModule
  private func checkPermissions(entity: EKEntityType) throws {
    guard let permissionsManager = appContext?.permissions else {
      throw PermissionsManagerNotFoundException()
    }

    var requester: EXPermissionsRequester.Type?
    switch entity {
    case .event:
    requester = CalendarPermissionsRequester.self
    case .reminder:
    requester = RemindersPermissionRequester.self
    @unknown default:
    requester = nil
    }
    if let requester, !permissionsManager.hasGrantedPermission(usingRequesterClass: requester) {
      let message = requester.permissionType().uppercased()
      throw MissionPermissionsException(message)
    }

    resetEventStoreIfPermissionWasChanged(entity: entity)
  }

  // TODO: Clean up, this is copied from CalendarModule
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

  // TODO: Clean up, this is copied from CalendarModule
  private func createPredicate(
    for calendars: [EKCalendar], start startDate: Date?, end endDate: Date?, status: String?
  ) throws -> NSPredicate {
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

  // TODO: Clean up, this is copied from CalendarModule
  private func presentEventEditViewController(event: EKEvent, promise: Promise) throws {
    guard let currentVc = appContext?.utilities?.currentViewController() else {
      throw Exception()
    }

    let controller = EditEventViewController(promise: promise, onDismiss: self.unsetDelegate)
    controller.event = event
    controller.eventStore = self.eventStore
    self.calendarDialogDelegate = CalendarDialogDelegate(
      promise: promise, onComplete: self.unsetDelegate)
    controller.editViewDelegate = self.calendarDialogDelegate

    currentVc.present(controller, animated: true)
  }

  // TODO: Clean up, this is copied from CalendarModule
  private func warnIfDialogInProgress() {
    if calendarDialogDelegate != nil {
      log.warn(
        "Calendar: Different calendar dialog is already being presented. Await its result before presenting another."
      )
    }
  }

  // TODO: Clean up, this is copied from CalendarModule
  private func unsetDelegate() {
    self.calendarDialogDelegate = nil
  }
}
