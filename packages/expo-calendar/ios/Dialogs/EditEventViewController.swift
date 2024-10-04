import EventKitUI
import ExpoModulesCore

class EditEventViewController: EKEventEditViewController, UIAdaptivePresentationControllerDelegate {
  private let promise: Promise
  private let onDismiss: () -> Void

  init(promise: Promise, onDismiss: @escaping () -> Void) {
    self.promise = promise
    self.onDismiss = onDismiss
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    onDismiss()
    promise.resolve(DialogEditResponse(action: .canceled))
  }
}
