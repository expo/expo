import Foundation
import ExpoModulesCore
import EventKit

internal final class ExpoCalendarAttendee: SharedObject {
    var attendee: EKParticipant
    
    init(attendee: EKParticipant) {
        self.attendee = attendee
    }
}
