// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Since iOS 11, launching ImagePicker with `allowsEditing` option makes cropping rectangle
 slightly moved upwards, because of StatusBar visibility.
 Hiding StatusBar during picking process solves the displacement issue.
 See https://forums.developer.apple.com/thread/98274
 */
internal class StatusBarVisibilityController {
  private var shouldRestoreStatusBarVisibility = false

  func maybePreserveVisibilityAndHideStatusBar(_ shouldHideStatusBar: Bool) {
    guard shouldHideStatusBar && !UIApplication.shared.isStatusBarHidden else {
      return
    }

    shouldRestoreStatusBarVisibility = true
    setStatusBarHidden(true)
  }

  func maybeRestoreStatusBarVisibility() {
    guard shouldRestoreStatusBarVisibility else {
      return
    }

    shouldRestoreStatusBarVisibility = false
    setStatusBarHidden(false)
  }

  /**
   Calling -[UIApplication setStatusBarHidden:withAnimation:] triggers a warning
   that should be suppressable with -Wdeprecated-declarations, but is not.
   The warning suggests to use -[UIViewController prefersStatusBarHidden].
   Unfortunately until we stop presenting view controllers on detached VCs
   the setting doesn't have any effect and we need to set status bar like that.
  */
  private func setStatusBarHidden(_ hidden: Bool) {
    let selector = NSSelectorFromString("setStatusBarHidden:withAnimation:")
    UIApplication.shared.perform(selector, with: hidden, with: false)

//    TODO: (@bbarthec) below is possible alternative
//    let obj = X()
//    let sel = #selector(obj.sayHiTo)
//    let meth = class_getInstanceMethod(object_getClass(obj), sel)
//    let imp = method_getImplementation(meth)
//
//    typealias ClosureType = @convention(c) (AnyObject, Selector, String) -> Void
//    let sayHiTo : ClosureType = unsafeBitCast(imp, ClosureType.self)
//    sayHiTo(obj, sel, "Fabio")
//    prints "Hello Fabio!"
  }
}
