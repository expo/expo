import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendarEvent: SharedObject {
    var event: EKEvent?

    init(event: EKEvent) {
        self.event = event
    }
}
