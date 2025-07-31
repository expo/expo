import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendarReminder: ExpoCalendarItem {
    var reminder: EKReminder?
    
    // Override the abstract property from ExpoCalendarItem
    override var calendarItem: EKCalendarItem? {
        return reminder
    }

    init(reminder: EKReminder) {
        self.reminder = reminder
    }
}
