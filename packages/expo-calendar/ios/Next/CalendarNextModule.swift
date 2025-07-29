import ExpoModulesCore

public final class CalendarNextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CalendarNext")
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
      }
  }
}
