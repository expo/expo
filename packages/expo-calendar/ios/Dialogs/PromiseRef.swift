import ExpoModulesCore

// TODO vonovak: this could / should be provided by Expo modules? Then it could be used in other modules as well.
class PromiseRef {
  private var promise: Promise?

  init(_ promise: Promise) {
    self.promise = promise
  }

  internal func resolve(_ value: Any? = nil) {
    // This prevents double resolve of the promise (which leads to a crash)
    // when `presentationControllerDidDismiss` is called together with
    // methods from EKEventEditViewDelegate / EKEventViewDelegate.
    // That can be achieved on iPad if you e.g. quickly delete an event and then tap outside of the dialog to dismiss it.
    // When preventing double-resolve, it's important the first time that `resolve` is called, it's called with the
    // value that is of interest to us. I.e. in the given example, EKEventEditViewDelegate / EKEventViewDelegate callbacks
    // provide the "correct" value which we should resolve with, and the dismissal is to be ignored.
    // The way it's done here is that the delegate callbacks are called before `presentationControllerDidDismiss`.

    if let promise = promise {
      self.promise = nil
      promise.resolve(value)
    }
  }
}
