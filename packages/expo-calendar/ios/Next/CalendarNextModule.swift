import ExpoModulesCore
import EventKit

public final class CalendarNextModule: Module {
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
            // initializePermittedEntities()
        }

        Function("getDefaultCalendarId") { () -> String in
            // try checkCalendarPermissions()
            guard let defaultCalendar = eventStore.defaultCalendarForNewEvents else {
                throw DefaultCalendarNotFoundException()
            }
            return defaultCalendar.calendarIdentifier
        }

        Function("getCalendarsIds") { (type: CalendarEntity?) -> [String] in
          var calendars: [EKCalendar]
          if type == nil {
            // try checkCalendarPermissions()
            // try checkRemindersPermissions()

            let eventCalendars = eventStore.calendars(for: .event)
            let reminderCalendars = eventStore.calendars(for: .reminder)
            calendars = eventCalendars + reminderCalendars
          } else if type == .event {
            // try checkCalendarPermissions()
            calendars = eventStore.calendars(for: .event)
          } else if type == .reminder {
            // try checkRemindersPermissions()
            calendars = eventStore.calendars(for: .reminder)
          } else {
            throw InvalidCalendarEntityException(type?.rawValue)
          }

          return calendars.map { $0.calendarIdentifier }
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
            
            Property("source") { (calendar: CustomExpoCalendar) in
                guard let calendar = calendar.calendar else { return [:] }
                return serialize(ekSource: calendar.source) as [String: Any]
            }
            
            Property("type") { (calendar: CustomExpoCalendar) in
                guard let calendar = calendar.calendar else { return "" }
                return calendarTypeToString(type: calendar.type, source: calendar.source.sourceType)
            }
            
            Property("allowsModifications") { (calendar: CustomExpoCalendar) in
                calendar.calendar?.allowsContentModifications ?? false
            }
            
            Property("allowedAvailabilities") { (calendar: CustomExpoCalendar) in
                guard let calendar = calendar.calendar else { return [] }
                return calendarSupportedAvailabilities(fromMask: calendar.supportedEventAvailabilities)
            }
            
            Function("listEventsAsIds") { (calendar: CustomExpoCalendar, startDateStr: Either<String, Double>, endDateStr: Either<String, Double>) in
                //   try checkCalendarPermissions()
                
                guard let startDate = parse(date: startDateStr),
                      let endDate = parse(date: endDateStr) else {
                    throw InvalidDateFormatException()
                }
                
                return calendar.listEventsAsIds(startDate: startDate, endDate: endDate)
            }
            
            Function("createEvent") { (calendar: CustomExpoCalendar, event: Event, options: RecurringEventOptions) -> String in
                // try checkCalendarPermissions()
                let calendarEvent = try calendar.getEvent(from: event)
                try calendar.initializeEvent(calendarEvent: calendarEvent, event: event)
                let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent
                
                try eventStore.save(calendarEvent, span: span, commit: true)
                return calendarEvent.calendarItemIdentifier
            }
        }
        
        Class(CustomExpoCalendarEvent.self) {
            Constructor { (id: String) in
                CustomExpoCalendarEvent(id: id)
            }
            
            Property("id") { (event: CustomExpoCalendarEvent) in
                event.event?.calendarItemIdentifier ?? ""
            }
            
            Property("title") { (event: CustomExpoCalendarEvent) in
                event.event?.title ?? ""
            }
            
            Property("startDate") { (event: CustomExpoCalendarEvent) -> String? in
                guard let startDate = event.event?.startDate else { return nil }
                return dateFormatter.string(from: startDate)
            }
            
            Property("endDate") { (event: CustomExpoCalendarEvent) -> String? in
                guard let endDate = event.event?.endDate else { return nil }
                return dateFormatter.string(from: endDate)
            }
            
            Function("getAttendees") { (event: CustomExpoCalendarEvent) in
                event.event?.attendees?.map { CustomExpoCalendarAttendee(attendee: $0) } ?? []
            }
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
}
