import EventKit
import EventKitUI
import ExpoModulesCore
import Foundation

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
                RemindersPermissionRequester(eventStore: eventStore),
            ])
            initializePermittedEntities()
        }
        
        Function("getDefaultCalendarId") { () -> String in
            try checkCalendarPermissions()
            guard let defaultCalendar = eventStore.defaultCalendarForNewEvents else {
                throw DefaultCalendarNotFoundException()
            }
            return defaultCalendar.calendarIdentifier
        }
        
        Function("getCalendarsIds") { (type: CalendarEntity?) -> [String] in
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
            
            return calendars.map { $0.calendarIdentifier }
        }
        
        Function("createCalendarNext") { (details: CalendarRecord) throws -> ExpoCalendar in
            let calendar: EKCalendar
            switch details.entityType {
            case .event:
                calendar = EKCalendar(for: .event, eventStore: eventStore)
            case .reminder:
                calendar = EKCalendar(for: .reminder, eventStore: eventStore)
            case .none:
                throw EntityNotSupportedException(details.entityType?.rawValue)
            }
            
            if let sourceId = details.sourceId {
                calendar.source = eventStore.source(withIdentifier: sourceId)
            } else {
                calendar.source =
                details.entityType == .event
                ? eventStore.defaultCalendarForNewEvents?.source
                : eventStore.defaultCalendarForNewReminders()?.source
            }
            
            calendar.title = details.title
            calendar.cgColor = EXUtilities.uiColor(details.color)?.cgColor
            
            try eventStore.saveCalendar(calendar, commit: true)
            return ExpoCalendar(calendar: calendar)
        }
        
        Function("listEvents") { (calendarIds: [String], startDateStr: Either<String, Double>, endDateStr: Either<String, Double>) -> [ExpoCalendarEvent] in
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
            
            return calendarEvents.map { ExpoCalendarEvent(event: $0) }
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
        
        Class(ExpoCalendar.self) {
            Constructor { (id: String) in
                ExpoCalendar(id: id)
            }
            
            Property("id") { (calendar: ExpoCalendar) in
                calendar.calendar?.calendarIdentifier ?? ""
            }
            
            Property("title") { (calendar: ExpoCalendar) in
                calendar.calendar?.title ?? ""
            }
            
            Property("source") { (expoCalendar: ExpoCalendar) in
                guard let calendar = expoCalendar.calendar else { return [:] }
                return serialize(ekSource: calendar.source)
            }
            
            Property("sourceId") { (expoCalendar: ExpoCalendar) in
                guard let calendar = expoCalendar.calendar else { return "" }
                return calendar.source.sourceIdentifier
            }
            
            Property("type") { (expoCalendar: ExpoCalendar) -> String in
                guard let calendar = expoCalendar.calendar else { return "" }
                return calendarTypeToString(type: calendar.type, source: calendar.source.sourceType)
            }
            
            Property("color") { (expoCalendar: ExpoCalendar) -> String in
                guard let cgColor = expoCalendar.calendar?.cgColor else { return "" }
                return EXUtilities.hexString(with: cgColor)
            }
            
            Property("entityType") { (expoCalendar: ExpoCalendar) -> String in
                guard let calendar = expoCalendar.calendar else { return "" }
                return entity(type: calendar.allowedEntityTypes) ?? ""
            }
            
            Property("allowsModifications") { (expoCalendar: ExpoCalendar) -> Bool in
                guard let calendar = expoCalendar.calendar else {
                    return false
                }
                return calendar.allowsContentModifications
            }
            
            Property("allowedAvailabilities") { (calendar: ExpoCalendar) -> [String] in
                guard let calendar = calendar.calendar else { return [] }
                return calendarSupportedAvailabilities(
                    fromMask: calendar.supportedEventAvailabilities)
            }
            
            Function("listEvents") {
                (
                    calendar: ExpoCalendar, startDateStr: Either<String, Double>,
                    endDateStr: Either<String, Double>
                ) throws in
                try checkCalendarPermissions()
                
                guard let startDate = parse(date: startDateStr),
                      let endDate = parse(date: endDateStr)
                else {
                    throw InvalidDateFormatException()
                }
                
                return try calendar.listEvents(startDate: startDate, endDate: endDate)
            }
            
            AsyncFunction("listReminders") {
                (
                    calendar: ExpoCalendar, startDateStr: Either<String, Double>,
                    endDateStr: Either<String, Double>, status: String?, promise: Promise
                ) throws in
                try checkRemindersPermissions()
                
                guard let startDate = parse(date: startDateStr),
                      let endDate = parse(date: endDateStr)
                else {
                    throw InvalidDateFormatException()
                }
                
                return calendar.listReminders(
                    startDate: startDate, endDate: endDate, status: status, promise: promise)
            }
            
            Function("createEvent") {
                (expoCalendar: ExpoCalendar, eventRecord: Event, options: RecurringEventOptions?)
                -> ExpoCalendarEvent in
                try checkCalendarPermissions()
                
                guard let calendar = expoCalendar.calendar else {
                    throw CalendarNoLongerExistsException()
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
            
            Function("createReminder") {
                (calendar: ExpoCalendar, eventRecord: Reminder, options: RecurringEventOptions?)
                -> ExpoCalendarReminder in
                try checkRemindersPermissions()
                let reminder = ExpoCalendarReminder()
                try reminder.initialize(reminderRecord: eventRecord, calendar: calendar.calendar)
                
                try eventStore.save(reminder.reminder!, commit: true)
                return reminder
            }
            
            Function("update") {
                (calendar: ExpoCalendar, calendarRecord: CalendarRecord) throws in
                try checkCalendarPermissions()
                try calendar.update(calendarRecord: calendarRecord)
            }
            
            Function("delete") { (calendar: ExpoCalendar) in
                try checkCalendarPermissions()
                try calendar.delete()
            }
        }
        
        Class(ExpoCalendarEvent.self) {
            Property("id") { (event: ExpoCalendarEvent) in
                event.event?.calendarItemIdentifier ?? ""
            }
            
            Property("calendarId") { (event: ExpoCalendarEvent) in
                event.event?.calendar.calendarIdentifier ?? ""
            }
            
            Property("title") { (event: ExpoCalendarEvent) in
                event.event?.title ?? ""
            }
            
            Property("location") { (event: ExpoCalendarEvent) in
                event.event?.location ?? ""
            }
            
            Property("creationDate") { (event: ExpoCalendarEvent) in
                dateFormatter.string(from: event.event?.creationDate ?? Date())
            }
            
            Property("lastModifiedDate") { (event: ExpoCalendarEvent) in
                dateFormatter.string(from: event.event?.lastModifiedDate ?? Date())
            }
            
            Property("timeZone") { (event: ExpoCalendarEvent) in
                event.event?.timeZone?.localizedName(for: .shortStandard, locale: .current) ?? ""
            }
            
            Property("url") { (event: ExpoCalendarEvent) in
                event.event?.url?.absoluteString.removingPercentEncoding ?? ""
            }
            
            Property("notes") { (event: ExpoCalendarEvent) in
                event.event?.notes ?? ""
            }
            
            Property("alarms") { (customEvent: ExpoCalendarEvent) -> [[String: Any?]]? in
                customEvent.serializeAlarms()
            }
            
            Property("recurrenceRule") {
                (customEvent: ExpoCalendarEvent) -> [String: Any?]? in
                customEvent.serializeRecurrenceRule()
            }
            
            Property("startDate") { (event: ExpoCalendarEvent) -> String? in
                guard let startDate = event.event?.startDate else { return nil }
                return dateFormatter.string(from: startDate)
            }
            
            Property("endDate") { (event: ExpoCalendarEvent) -> String? in
                guard let endDate = event.event?.endDate else { return nil }
                return dateFormatter.string(from: endDate)
            }
            
            Property("originalStartDate") { (event: ExpoCalendarEvent) -> String? in
                guard let occurrenceDate = event.event?.occurrenceDate else { return nil }
                return dateFormatter.string(from: occurrenceDate)
            }
            
            Property("isDetached") { (event: ExpoCalendarEvent) in
                event.event?.isDetached ?? false
            }
            
            Property("allDay") { (event: ExpoCalendarEvent) in
                event.event?.isAllDay ?? false
            }
            
            Property("availability") { (event: ExpoCalendarEvent) in
                guard let availability = event.event?.availability else { return "" }
                return eventAvailabilityToString(availability)
            }
            
            Property("status") { (event: ExpoCalendarEvent) in
                eventStatusToString(event.event?.status ?? .none)
            }
            
            Property("organizer") { (event: ExpoCalendarEvent) -> [String: Any?]? in
                guard let organizer = event.event?.organizer else { return nil }
                return serialize(attendee: organizer)
            }
            
            AsyncFunction("openInCalendarAsync") {
                (
                    expoEvent: ExpoCalendarEvent,
                    options: OpenInCalendarOptions?,
                    promise: Promise
                ) in
                try checkCalendarPermissions()
                
                let startDate = parse(date: options?.instanceStartDate)
                guard let calendarEvent = expoEvent.getEvent(startDate: startDate) else {
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
            
            AsyncFunction("editInCalendarAsync") {
                (
                    expoEvent: ExpoCalendarEvent,
                    options: OpenInCalendarOptions?,
                    promise: Promise
                ) in
                try checkCalendarPermissions()
                
                print("editInCalendarAsync")
                warnIfDialogInProgress()
                
                guard let event = expoEvent.event else {
                    throw ItemNoLongerExistsException()
                }
                
                try presentEventEditViewController(event: event, promise: promise)
            }.runOnQueue(.main)
            
            Function("getAttendees") { (customEvent: ExpoCalendarEvent, options: RecurringEventOptions?) in
                try checkCalendarPermissions()
                
                let instanceStartDate = parse(date: options?.instanceStartDate)
                
                let item = customEvent.getEvent(startDate: instanceStartDate)
                
                guard let item, let attendees = item.attendees else {
                    return []
                }
                
                print("Names: \(attendees.map(\.name))")
                
                // TODO: It is returning nulls for some reason?
                return attendees.map { ExpoCalendarAttendee(attendee: $0) }
            }
            
            Function("update") {
                (customEvent: ExpoCalendarEvent, event: Event, options: RecurringEventOptions?)
                throws in
                try checkCalendarPermissions()
                try customEvent.update(eventRecord: event, options: options)
            }
            
            Function("delete") {
                (customEvent: ExpoCalendarEvent, options: RecurringEventOptions) in
                try checkCalendarPermissions()
                try customEvent.delete(options: options)
            }
        }
        
        Class(ExpoCalendarReminder.self) {
            Property("id") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.calendarItemIdentifier ?? ""
            }
            
            Property("calendarId") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.calendar.calendarIdentifier ?? ""
            }
            
            Property("title") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.title ?? ""
            }
            
            Property("location") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.location ?? ""
            }
            
            Property("creationDate") { (reminder: ExpoCalendarReminder) in
                dateFormatter.string(from: reminder.reminder?.creationDate ?? Date())
            }
            
            Property("lastModifiedDate") { (reminder: ExpoCalendarReminder) in
                dateFormatter.string(from: reminder.reminder?.lastModifiedDate ?? Date())
            }
            
            Property("timeZone") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.timeZone?.localizedName(for: .shortStandard, locale: .current)
                ?? ""
            }
            
            Property("url") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.url?.absoluteString.removingPercentEncoding ?? ""
            }
            
            Property("notes") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.notes ?? ""
            }
            
            Property("alarms") { (reminder: ExpoCalendarReminder) -> [[String: Any?]]? in
                reminder.serializeAlarms()
            }
            
            Property("recurrenceRule") {
                (customReminder: ExpoCalendarReminder) -> [String: Any?]? in
                customReminder.serializeRecurrenceRule()
            }
            
            Property("startDate") { (customReminder: ExpoCalendarReminder) -> String? in
                let currentCalendar = Calendar.current
                
                guard let startDateComponents = customReminder.reminder?.startDateComponents else {
                    return nil
                }
                
                guard let startDate = currentCalendar.date(from: startDateComponents) else {
                    return nil
                }
                
                return dateFormatter.string(from: startDate)
            }
            
            Property("dueDate") { (customReminder: ExpoCalendarReminder) -> String? in
                let currentCalendar = Calendar.current
                
                guard let dueDateComponents = customReminder.reminder?.dueDateComponents else {
                    return nil
                }
                
                guard let dueDate = currentCalendar.date(from: dueDateComponents) else {
                    return nil
                }
                
                return dateFormatter.string(from: dueDate)
            }
            
            Property("completed") { (reminder: ExpoCalendarReminder) in
                reminder.reminder?.isCompleted ?? false
            }
            
            Property("completionDate") { (reminder: ExpoCalendarReminder) in
                dateFormatter.string(from: reminder.reminder?.completionDate ?? Date())
            }
            
            Function("update") { (reminder: ExpoCalendarReminder, reminderRecord: Reminder) in
                try checkRemindersPermissions()
                try reminder.initialize(reminderRecord: reminderRecord)
                try eventStore.save(reminder.reminder!, commit: true)
            }
            
            Function("delete") { (reminder: ExpoCalendarReminder) in
                try checkRemindersPermissions()
                try reminder.delete()
            }
        }
        
        Class(ExpoCalendarAttendee.self) {
            Property("name") { (attendee: ExpoCalendarAttendee) in
                attendee.attendee.name ?? ""
            }
            
            Property("isCurrentUser") { (attendee: ExpoCalendarAttendee) in
                attendee.attendee.isCurrentUser
            }
            
            Property("role") { (attendee: ExpoCalendarAttendee) in
                participantToString(role: attendee.attendee.participantRole)
            }
            
            Property("status") { (attendee: ExpoCalendarAttendee) in
                participantStatusToString(status: attendee.attendee.participantStatus)
            }
            
            Property("type") { (attendee: ExpoCalendarAttendee) in
                participantTypeToString(type: attendee.attendee.participantType)
            }
            
            Property("url") { (attendee: ExpoCalendarAttendee) in
                attendee.attendee.url.absoluteString.removingPercentEncoding
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
            usingRequesterClass: CalendarPermissionsRequester.self)
        {
            permittedEntities.insert(.event)
        }
        
        if permissionsManager.hasGrantedPermission(
            usingRequesterClass: RemindersPermissionRequester.self)
        {
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
