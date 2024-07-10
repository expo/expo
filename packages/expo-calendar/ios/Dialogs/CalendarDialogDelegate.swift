import EventKitUI
import ExpoModulesCore

class CalendarDialogDelegate: NSObject, EKEventEditViewDelegate, EKEventViewDelegate {
  private let promise: Promise
  private let onComplete: () -> Void

  init(promise: Promise, onComplete: @escaping () -> Void) {
    self.promise = promise
    self.onComplete = onComplete
  }

  func eventEditViewController(_ controller: EKEventEditViewController, didCompleteWith action: EKEventEditViewAction) {
    switch action {
    case .canceled: promise.resolve(DialogEditResponse(action: .canceled))
    case .deleted: promise.resolve(DialogEditResponse(action: .deleted))
    case .saved:
      let evt = controller.event
      let id = evt?.calendarItemIdentifier
      promise.resolve(DialogEditResponse(action: .saved, id: id))
    default: promise.resolve(DialogEditResponse())
    }
    controller.dismiss(animated: true, completion: onComplete)
  }

  func eventViewController(_ controller: EKEventViewController, didCompleteWith action: EKEventViewAction) {
    switch action {
    case .responded: promise.resolve(DialogViewResponse(action: .responded))
    case .deleted: promise.resolve(DialogViewResponse(action: .deleted))
    case .done: fallthrough
    default: promise.resolve(DialogViewResponse())
    }
    controller.dismiss(animated: true, completion: onComplete)
  }
}
