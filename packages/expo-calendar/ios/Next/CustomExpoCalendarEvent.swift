import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendarEvent: SharedObject {
    var eventStore: EKEventStore
    var event: EKEvent?
    
    init(id: String) {
        self.eventStore = EKEventStore()
        self.event = eventStore.event(withIdentifier: id)
        
        print("CustomExpoCalendarEvent \(id) initialized with title: \(self.event?.title ?? "No title")")
    }
}
