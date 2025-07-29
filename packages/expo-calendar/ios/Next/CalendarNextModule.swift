import Foundation
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
                return serialize(ekSource: calendar.source)
            }

            Property("sourceId") { (calendar: CustomExpoCalendar) in
                guard let calendar = calendar.calendar else { return "" }
                return calendar.source.sourceIdentifier
            }
            
            Property("type") { (calendar: CustomExpoCalendar) in
                guard let calendar = calendar.calendar else { return "" }
                return calendarTypeToString(type: calendar.type, source: calendar.source.sourceType)
            }

            // Property("color") { (calendar: CustomExpoCalendar) in
            //     guard let cgColor = calendar.color else { return "" }
            //     return EXUtilities.hexString(with: cgColor) ?? ""
            // }

            Property("entityType") { (calendar: CustomExpoCalendar) in
                guard let calendar = calendar.calendar else { return "" }
                return entity(type: calendar.allowedEntityTypes) ?? ""
            }
            
            Property("allowsModifications") { (calendar: CustomExpoCalendar) in
                calendar.calendar?.allowsContentModifications ?? false
            }
            
            Property("allowedAvailabilities") { (calendar: CustomExpoCalendar) in
                guard let calendar = calendar.calendar else { return [] }
                return calendarSupportedAvailabilities(fromMask: calendar.supportedEventAvailabilities)
            }
            
            Function("listEvents") { (calendar: CustomExpoCalendar, startDateStr: Either<String, Double>, endDateStr: Either<String, Double>) in
                //   try checkCalendarPermissions()
                
                guard let startDate = parse(date: startDateStr),
                      let endDate = parse(date: endDateStr) else {
                    throw InvalidDateFormatException()
                }
                
                return calendar.listEvents(startDate: startDate, endDate: endDate)
            }
            
            Function("createEvent") { (calendar: CustomExpoCalendar, event: Event, options: RecurringEventOptions) -> String in
                // try checkCalendarPermissions()
                let calendarEvent = try calendar.getEvent(from: event)
                try calendar.initializeEvent(calendarEvent: calendarEvent, event: event)
                let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent
                
                try eventStore.save(calendarEvent, span: span, commit: true)
                return calendarEvent.calendarItemIdentifier
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

//            Property("alarms") { (event: CustomExpoCalendarEvent) in
//                let alarms = event.event?.alarms ?? []
//                serialize(alarms: alarms, with: dateFormatter)
//            }

            // Property("recurrenceRule") { (event: CustomExpoCalendarEvent) in
            //     event.event?.recurrenceRule ?? nil
            // }
            
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
