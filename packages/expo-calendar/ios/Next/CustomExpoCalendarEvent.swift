import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendarEvent: SharedObject {
    private var eventStore: EKEventStore {
        return CalendarModule.sharedEventStore
    }
    var event: EKEvent?
    
    init(event: EKEvent) {
        self.event = event
    }
    
    func delete(options: RecurringEventOptions) throws {
        guard let id = self.event?.calendarItemIdentifier else {
            throw EventIdRequiredException()
        }
        print("ID: \(id)")
        let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent
        
        let instanceStartDate = parse(date: options.instanceStartDate)
        let calendarEvent = getEvent(with: id, startDate: instanceStartDate)
        
        guard let calendarEvent else {
            return
        }
        print("calendarEvent: \(calendarEvent.calendarItemIdentifier)")
        try eventStore.remove(calendarEvent, span: span)
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
}
