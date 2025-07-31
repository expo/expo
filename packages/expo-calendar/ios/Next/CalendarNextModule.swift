import Foundation
import ExpoModulesCore
import EventKit

public final class CalendarNextModule: Module {
    private var permittedEntities: EKEntityMask = .event
    private var eventStore: EKEventStore {
        // Use sharedEventStore, there were problems when accessing two different stores.
        return CalendarModule.sharedEventStore
    }
    
    public func definition() -> ModuleDefinition {
        Name("CalendarNext")
        
        OnCreate {
            self.appContext?.permissions?.register([
                CalendarPermissionsRequester(eventStore: eventStore),
                RemindersPermissionRequester(eventStore: eventStore)
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
        
        Function("createCalendarNext") { (details: CalendarRecord) throws -> CustomExpoCalendar in
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
                calendar.source = details.entityType == .event ?
                eventStore.defaultCalendarForNewEvents?.source :
                eventStore.defaultCalendarForNewReminders()?.source
            }
            
            calendar.title = details.title
            calendar.cgColor = EXUtilities.uiColor(details.color)?.cgColor
            
            try eventStore.saveCalendar(calendar, commit: true)
            return CustomExpoCalendar(calendar: calendar)
        }
        
        Class(CustomExpoCalendar.self) {
            Constructor { (id: String) in
                CustomExpoCalendar(id: id)
            }
            
            Property("id") { (calendar: CustomExpoCalendar) in
                calendar.calendar?.calendarIdentifier ?? ""
            }
            
            Property("title") { (calendar: CustomExpoCalendar) in
                calendar.calendar?.title ?? ""
            }
            
            Property("source") { (expoCalendar: CustomExpoCalendar) in
                guard let calendar = expoCalendar.calendar else { return [:] }
                return serialize(ekSource: calendar.source)
            }
            
            Property("sourceId") { (expoCalendar: CustomExpoCalendar) in
                guard let calendar = expoCalendar.calendar else { return "" }
                return calendar.source.sourceIdentifier
            }
            
            Property("type") { (expoCalendar: CustomExpoCalendar) -> String in
                guard let calendar = expoCalendar.calendar else { return "" }
                return calendarTypeToString(type: calendar.type, source: calendar.source.sourceType)
            }
            
            Property("color") { (expoCalendar: CustomExpoCalendar) -> String in
                guard let cgColor = expoCalendar.calendar?.cgColor else { return "" }
                return EXUtilities.hexString(with: cgColor)
            }
            
            Property("entityType") { (expoCalendar: CustomExpoCalendar) -> String in
                guard let calendar = expoCalendar.calendar else { return "" }
                return entity(type: calendar.allowedEntityTypes) ?? ""
            }
            
            Property("allowsModifications") { (expoCalendar: CustomExpoCalendar) -> Bool in
                guard let calendar = expoCalendar.calendar else {
                    return false
                }
                return calendar.allowsContentModifications
            }
            
            Property("allowedAvailabilities") { (calendar: CustomExpoCalendar) -> [String] in
                guard let calendar = calendar.calendar else { return [] }
                return calendarSupportedAvailabilities(fromMask: calendar.supportedEventAvailabilities)
            }
            
            Function("listEvents") { (calendar: CustomExpoCalendar, startDateStr: Either<String, Double>, endDateStr: Either<String, Double>) throws in
                try checkCalendarPermissions()
                
                guard let startDate = parse(date: startDateStr),
                      let endDate = parse(date: endDateStr) else {
                    throw InvalidDateFormatException()
                }
                
                return try calendar.listEvents(startDate: startDate, endDate: endDate)
            }
            
            AsyncFunction("listReminders") { (calendar: CustomExpoCalendar, startDateStr: Either<String, Double>, endDateStr: Either<String, Double>, status: String?, promise: Promise) throws in
                try checkRemindersPermissions()
                
                guard let startDate = parse(date: startDateStr),
                      let endDate = parse(date: endDateStr) else {
                    throw InvalidDateFormatException()
                }
                
                return calendar.listReminders(startDate: startDate, endDate: endDate, status: status, promise: promise)
            }
            
            Function("createEvent") { (calendar: CustomExpoCalendar, eventRecord: Event, options: RecurringEventOptions?) -> CustomExpoCalendarEvent in
                try checkCalendarPermissions()
                
                let expoCalendarEvent = try CustomExpoCalendarEvent(eventRecord: eventRecord)
                
                // TODO: Maybe not needed?
                try expoCalendarEvent.initialize(eventRecord: eventRecord)
                
                let span: EKSpan = options?.futureEvents == true ? .futureEvents : .thisEvent
                
                guard let ekEvent = expoCalendarEvent.event else {
                    throw EventNotFoundException("Expo event could not be created")
                }
                
                try eventStore.save(ekEvent, span: span, commit: true)
                
                return expoCalendarEvent
            }
            
            Function("update") { (calendar: CustomExpoCalendar, calendarRecord: CalendarRecord) throws in
                try calendar.update(calendarRecord: calendarRecord)
            }
            
            Function("delete") { (calendar: CustomExpoCalendar) in
                try calendar.delete()
            }
        }
        
        Class(CustomExpoCalendarEvent.self) {
            Property("id") { (event: CustomExpoCalendarEvent) in
                event.event?.calendarItemIdentifier ?? ""
            }
            
            Property("calendarId") { (event: CustomExpoCalendarEvent) in
                event.event?.calendar.calendarIdentifier ?? ""
            }
            
            Property("title") { (event: CustomExpoCalendarEvent) in
                event.event?.title ?? ""
            }
            
            Property("location") { (event: CustomExpoCalendarEvent) in
                event.event?.location ?? ""
            }
            
            Property("creationDate") { (event: CustomExpoCalendarEvent) in
                dateFormatter.string(from: event.event?.creationDate ?? Date())
            }
            
            Property("lastModifiedDate") { (event: CustomExpoCalendarEvent) in
                dateFormatter.string(from: event.event?.lastModifiedDate ?? Date())
            }
            
            Property("timeZone") { (event: CustomExpoCalendarEvent) in
                event.event?.timeZone?.localizedName(for: .shortStandard, locale: .current) ?? ""
            }
            
            Property("url") { (event: CustomExpoCalendarEvent) in
                event.event?.url?.absoluteString.removingPercentEncoding ?? ""
            }
            
            Property("notes") { (event: CustomExpoCalendarEvent) in
                event.event?.notes ?? ""
            }
            
            Property("alarms") { (event: CustomExpoCalendarEvent) -> [[String: Any?]] in
                let alarms: [EKAlarm]  = event.event?.alarms ?? []
                return serialize(alarms: alarms, with: dateFormatter)
            }
            
            Property("recurrenceRule") { (customEvent: CustomExpoCalendarEvent) -> [String: Any?] in
                guard let rule = customEvent.event?.recurrenceRules?.first else {
                    return [:]
                }
                let frequencyType = recurrenceToString(frequency: rule.frequency)
                var recurrenceRule: [String: Any?] = ["frequency": frequencyType]

                recurrenceRule["interval"] = rule.interval

                if let endDate = rule.recurrenceEnd?.endDate {
                  recurrenceRule["endDate"] = dateFormatter.string(from: endDate)
                }

                recurrenceRule["occurrence"] = rule.recurrenceEnd?.occurrenceCount

                if let daysOfTheWeek = rule.daysOfTheWeek {
                  recurrenceRule["daysOfTheWeek"] = daysOfTheWeek.map({ day in
                    [
                      "dayOfTheWeek": day.dayOfTheWeek.rawValue,
                      "weekNumber": day.weekNumber
                    ]
                  })
                }

                if let daysOfTheMonth = rule.daysOfTheMonth {
                  recurrenceRule["daysOfTheMonth"] = daysOfTheMonth
                }

                if let daysOfTheYear = rule.daysOfTheYear {
                  recurrenceRule["daysOfTheYear"] = daysOfTheYear
                }

                if let monthsOfTheYear = rule.monthsOfTheYear {
                  recurrenceRule["monthsOfTheYear"] = monthsOfTheYear
                }

                if let setPositions = rule.setPositions {
                  recurrenceRule["setPositions"] = setPositions
                }
                
                return recurrenceRule
            }
            
            Property("startDate") { (event: CustomExpoCalendarEvent) -> String? in
                guard let startDate = event.event?.startDate else { return nil }
                return dateFormatter.string(from: startDate)
            }
            
            Property("endDate") { (event: CustomExpoCalendarEvent) -> String? in
                guard let endDate = event.event?.endDate else { return nil }
                return dateFormatter.string(from: endDate)
            }
            
            Property("originalStartDate") { (event: CustomExpoCalendarEvent) -> String? in
                guard let occurrenceDate = event.event?.occurrenceDate else { return nil }
                return dateFormatter.string(from: occurrenceDate)
            }
            
            Property("isDetached") { (event: CustomExpoCalendarEvent) in
                event.event?.isDetached ?? false
            }
            
            Property("allDay") { (event: CustomExpoCalendarEvent) in
                event.event?.isAllDay ?? false
            }
            
            Property("availability") { (event: CustomExpoCalendarEvent) in
                guard let availability = event.event?.availability else { return "" }
                return eventAvailabilityToString(availability)
            }
            
            Property("status") { (event: CustomExpoCalendarEvent) in
                eventStatusToString(event.event?.status ?? .none)
            }
            
            Property("organizer") { (event: CustomExpoCalendarEvent) -> [String: Any?]? in
                guard let organizer = event.event?.organizer else { return nil }
                return serialize(attendee: organizer)
            }
            
            Function("getAttendees") { (customEvent: CustomExpoCalendarEvent) in
                customEvent.event?.attendees?.map { CustomExpoCalendarAttendee(attendee: $0) } ?? []
            }
            
            Function("update") { (customEvent: CustomExpoCalendarEvent, event: Event, options: RecurringEventOptions) throws in
                try customEvent.update(eventRecord: event, options: options)
            }
            
            Function("delete") { (customEvent: CustomExpoCalendarEvent, options: RecurringEventOptions) in
                try customEvent.delete(options: options)
            }
        }
        
        Class(CustomExpoCalendarReminder.self) {
            Property("id") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.calendarItemIdentifier ?? ""
            }
            
            Property("calendarId") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.calendar.calendarIdentifier ?? ""
            }
            
            Property("title") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.title ?? ""
            }
            
            Property("location") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.location ?? ""
            }
            
            Property("creationDate") { (reminder: CustomExpoCalendarReminder) in
                dateFormatter.string(from: reminder.reminder?.creationDate ?? Date())
            }
            
            Property("lastModifiedDate") { (reminder: CustomExpoCalendarReminder) in
                dateFormatter.string(from: reminder.reminder?.lastModifiedDate ?? Date())
            }
            
            Property("timeZone") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.timeZone?.localizedName(for: .shortStandard, locale: .current) ?? ""
            }
            
            Property("url") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.url?.absoluteString.removingPercentEncoding ?? ""
            }
            
            Property("notes") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.notes ?? ""
            }
            
            Property("alarms") { (reminder: CustomExpoCalendarReminder) in
                serialize(alarms: reminder.reminder?.alarms ?? [], with: dateFormatter)
            }
            
            // Property("recurrenceRule") { (reminder: CustomExpoCalendarReminder) in
            //     reminder.reminder?.recurrenceRule ?? nil
            // }
            
            //           Property("startDate") { (reminder: CustomExpoCalendarReminder) in
            //               dateFormatter.string(from: reminder.reminder?.calendar.startDate ?? Date())
            //           }
            
            //            Property("dueDate") { (reminder: CustomExpoCalendarReminder) in
            //                dateFormatter.string(from: reminder.reminder?.dueDate ?? Date())
            //            }
            
            Property("completed") { (reminder: CustomExpoCalendarReminder) in
                reminder.reminder?.isCompleted ?? false
            }
            
            Property("completionDate") { (reminder: CustomExpoCalendarReminder) in
                dateFormatter.string(from: reminder.reminder?.completionDate ?? Date())
            }
            
            //            Function("delete") { (reminder: CustomExpoCalendarReminder) in
            //                try reminder.delete()
            //            }
        }
        
        Class(CustomExpoCalendarAttendee.self) {
            Property("name") { (attendee: CustomExpoCalendarAttendee) in
                attendee.attendee.name ?? ""
            }
            
            Property("isCurrentUser") { (attendee: CustomExpoCalendarAttendee) in
                attendee.attendee.isCurrentUser
            }
            
            Property("role") { (attendee: CustomExpoCalendarAttendee) in
                participantToString(role: attendee.attendee.participantRole)
            }
            
            Property("status") { (attendee: CustomExpoCalendarAttendee) in
                participantStatusToString(status: attendee.attendee.participantStatus)
            }
            
            Property("type") { (attendee: CustomExpoCalendarAttendee) in
                participantTypeToString(type: attendee.attendee.participantType)
            }
            
            Property("url") { (attendee: CustomExpoCalendarAttendee) in
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
        if permissionsManager.hasGrantedPermission(usingRequesterClass: CalendarPermissionsRequester.self) {
            permittedEntities.insert(.event)
        }
        
        if permissionsManager.hasGrantedPermission(usingRequesterClass: RemindersPermissionRequester.self) {
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
