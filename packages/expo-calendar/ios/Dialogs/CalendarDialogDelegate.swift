import EventKitUI
import ExpoModulesCore

class CalendarDialogDelegate: NSObject, EKEventEditViewDelegate, EKEventViewDelegate {
  private let promise: PromiseRef
  private let onComplete: () -> Void

  init(promise: PromiseRef, onComplete: @escaping () -> Void) {
    self.promise = promise
    self.onComplete = onComplete
  }

  func eventEditViewController(_ controller: EKEventEditViewController, didCompleteWith action: EKEventEditViewAction) {
    switch action {
    case .canceled: promise.resolve(CalendarResponse(action: "canceled"))
    case .deleted: promise.resolve(CalendarResponse(action: "deleted"))
    case .saved:
      let evt = controller.event
      let id = evt?.calendarItemIdentifier
      promise.resolve(CalendarSavedResponse(id: id))
    default: promise.resolve(CalendarResponse())
    }
    controller.dismiss(animated: true, completion: onComplete)
  }

  func eventViewController(_ controller: EKEventViewController, didCompleteWith action: EKEventViewAction) {
    switch action {
    case .responded: promise.resolve(CalendarResponse(action: "responded"))
    case .deleted: promise.resolve(CalendarResponse(action: "deleted"))
    case .done: fallthrough
    default: promise.resolve(CalendarResponse())
    }
    controller.dismiss(animated: true, completion: onComplete)
  }
}
