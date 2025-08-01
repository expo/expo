import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendar: SharedObject {
    var eventStore: EKEventStore
    var calendar: EKCalendar?

    init(id: String) {
        self.eventStore = EKEventStore()
        self.calendar = self.eventStore.calendar(withIdentifier: id)
        print("CustomExpoCalendar initialized with id: \(self.calendar.map(\.title) ?? "No title")")
    }

    // Internal only function
    func listEventsAsIds(startDate: Date, endDate: Date) -> [String] {
        guard let calendar = self.calendar else {
            return []
        }
        let predicate = self.eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [calendar])
        let events = self.eventStore.events(matching: predicate).sorted {
            $0.startDate.compare($1.startDate) == .orderedAscending
        }
        let eventIds = events.map { $0.calendarItemIdentifier }
        return eventIds
    }
}
