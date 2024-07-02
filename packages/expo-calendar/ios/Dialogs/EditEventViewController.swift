import EventKitUI
import ExpoModulesCore

class EditEventViewController: EKEventEditViewController, UIAdaptivePresentationControllerDelegate {
  
  private let promise: PromiseRef
  private let onDismiss: () -> Void
  
  init(promise: PromiseRef, onDismiss: @escaping () -> Void) {
    self.promise = promise
    self.onDismiss = onDismiss
    super.init(nibName: nil, bundle: nil)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    onDismiss()
    promise.resolve(CalendarResponse(action: "canceled"))
  }
}
