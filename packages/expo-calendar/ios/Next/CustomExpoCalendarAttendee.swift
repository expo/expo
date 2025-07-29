import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendarAttendee: SharedObject {
    var attendee: EKParticipant

    init(attendee: EKParticipant) {
        self.attendee = attendee
        print("CustomExpoCalendarAttendee using attendee initialized with name: \(self.attendee.name ?? "No name")")
    }
}
