import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendarReminder: SharedObject {
    var reminder: EKReminder?

    init(reminder: EKReminder) {
        self.reminder = reminder
    }
}
