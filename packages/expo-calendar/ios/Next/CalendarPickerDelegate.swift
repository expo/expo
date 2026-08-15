import EventKit
import EventKitUI
import ExpoModulesCore

class CalendarPickerDelegate: NSObject, EKCalendarChooserDelegate {
  private let promise: Promise
  private let onComplete: () -> Void

  init(promise: Promise, onComplete: @escaping () -> Void) {
    self.promise = promise
    self.onComplete = onComplete
  }

  func calendarChooserDidFinish(_ calendarChooser: EKCalendarChooser) {
    let calendar = calendarChooser.selectedCalendars.first
    promise.resolve(calendar.map { ExpoCalendar(calendar: $0) })
    calendarChooser.dismiss(animated: true)
    onComplete()
  }

  func calendarChooserDidCancel(_ calendarChooser: EKCalendarChooser) {
    promise.resolve(nil)
    calendarChooser.dismiss(animated: true)
    onComplete()
  }
}
