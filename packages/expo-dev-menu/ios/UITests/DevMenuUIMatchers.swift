import XCTest
import UIKit

class DevMenuViews {
  static let mainScreen = "DevMenuMainScreen"
  static let footer = "DevMenuFooter"
  static let settingsScreen = "DevMenuSettingsScreen"
  static let profileScreen = "DevMenuProfileScreen"
}

class DevMenuUIMatchers {
  static func currentRootView() -> UIView? {
    return UIApplication.shared.keyWindow?.rootViewController?.view
  }

  static func findView(rootView: UIView, _ matcher: (UIView) -> Bool) -> UIView? {
    if matcher(rootView) {
      return rootView
    }

    for subView in rootView.subviews {
      let found = findView(rootView: subView, matcher)
      if found != nil {
        return found
      }
    }

    return nil
  }

  static func findView(_ matcher: (UIView) -> Bool) -> UIView? {
    guard let view = DevMenuUIMatchers.currentRootView() else {
      return nil
    }

    return findView(rootView: view, matcher)
  }

  static func findView(rootView: UIView, tag: String) -> UIView? {
    return DevMenuUIMatchers.findView(rootView: rootView) {
      return $0.accessibilityIdentifier == tag && $0.isVisible()
    }
  }

  static func findView(tag: String) -> UIView? {
    guard let view = DevMenuUIMatchers.currentRootView() else {
      return nil
    }

    return findView(rootView: view, tag: tag)
  }

  static func waitForView(_ matcher: (UIView) -> Bool) -> UIView {
    let timer = Date(timeIntervalSinceNow: DevMenuTestOptions.defaultTimeout)

    while timer.timeIntervalSinceNow > 0 {
      DevMenuLooper.runMainLoop(for: DevMenuTestOptions.loopTime)

      guard let view = DevMenuUIMatchers.currentRootView() else {
        continue
      }

      let found = findView(rootView: view, matcher)
      if found != nil {
        return found!
      }
    }

    XCTFail("Can not find view.")
    return UIView() // just for compiler
  }

  static func waitForView(tag: String) -> UIView {
    return waitForView {
      return $0.accessibilityIdentifier == tag && $0.isVisible()
    }
  }

  static func waitForView(text: String) -> UIView {
    return waitForView {
      if type(of: $0) == NSClassFromString("RCTTextView")! {
        return $0.isVisible() && ($0.value(forKey: "_textStorage") as! NSTextStorage).string == text
      }

      return false
    }
  }

  static func findView(rootView: UIView, text: String) -> UIView? {
    findView(rootView: rootView) {
      if type(of: $0) == NSClassFromString("RCTTextView")! {
        return $0.isVisible() && ($0.value(forKey: "_textStorage") as! NSTextStorage).string == text
      }

      return false
    }
  }

  static func findView(text: String) -> UIView? {
    guard let view = DevMenuUIMatchers.currentRootView() else {
      return nil
    }

    return findView(rootView: view, text: text)
  }
}
