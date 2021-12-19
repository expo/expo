// Copyright 2015-present 650 Industries. All rights reserved.

let motionGestureEnabledKey = "EXDevMenuMotionGestureEnabled"
let touchGestureEnabledKey = "EXDevMenuTouchGestureEnabled"
let keyCommandsEnabledKey = "EXDevMenuKeyCommandsEnabled"
let showsAtLaunchKey = "EXDevMenuShowsAtLaunch"
let isOnboardingFinishedKey = "EXDevMenuIsOnboardingFinished"

@objc
public class DevMenuSettings: NSObject {
  /**
   Initializes dev menu settings by registering user defaults
   and applying some settings to static classes like interceptors.
   */
  static func setup() {
    UserDefaults.standard.register(defaults: [
      motionGestureEnabledKey: true,
      touchGestureEnabledKey: true,
      keyCommandsEnabledKey: true,
      showsAtLaunchKey: false,
      isOnboardingFinishedKey: false
    ])

    /**
     We don't want to uninstall `DevMenuMotionInterceptor`, because otherwise, the app on shake gesture will bring up the dev-menu from the RN.
     So we added `isEnabled` to disable it, but not uninstall.
     */
    DevMenuMotionInterceptor.isInstalled = true
    DevMenuMotionInterceptor.isEnabled = DevMenuSettings.motionGestureEnabled
    DevMenuTouchInterceptor.isInstalled = DevMenuSettings.touchGestureEnabled
    DevMenuKeyCommandsInterceptor.isInstalled = DevMenuSettings.keyCommandsEnabled
  }

  /**
   Whether to enable shake gesture.
   */
  static var motionGestureEnabled: Bool {
    get {
      return boolForKey(motionGestureEnabledKey)
    }
    set {
      setBool(newValue, forKey: motionGestureEnabledKey)
      DevMenuMotionInterceptor.isEnabled = newValue
    }
  }

  /**
   Whether to enable three-finger long press gesture.
   */
  static var touchGestureEnabled: Bool {
    get {
      return boolForKey(touchGestureEnabledKey)
    }
    set {
      setBool(newValue, forKey: touchGestureEnabledKey)
      DevMenuTouchInterceptor.isInstalled = newValue
    }
  }

  /**
   Whether to enable key commands.
   */
  static var keyCommandsEnabled: Bool {
    get {
      return boolForKey(keyCommandsEnabledKey)
    }
    set {
      setBool(newValue, forKey: keyCommandsEnabledKey)
      DevMenuKeyCommandsInterceptor.isInstalled = newValue
    }
  }

  /**
   Whether to automatically show the dev menu once its delegate is set and the bridge is loaded.
   */
  static var showsAtLaunch: Bool {
    get {
      return DevMenuTestInterceptorManager.interceptor?.shouldShowAtLaunch ?? boolForKey(showsAtLaunchKey)
    }
    set {
      setBool(newValue, forKey: showsAtLaunchKey)
    }
  }

  /**
   Returns `true` only if the user finished onboarding, `false` otherwise.
   */
  static var isOnboardingFinished: Bool {
    get {
      return DevMenuTestInterceptorManager.interceptor?.isOnboardingFinishedKey ?? boolForKey(isOnboardingFinishedKey)
    }
    set {
      setBool(newValue, forKey: isOnboardingFinishedKey)
    }
  }

  /**
   Serializes settings into a dictionary so they can be passed through the bridge.
   */
  static func serialize() -> [String: Any] {
    return [
      "motionGestureEnabled": DevMenuSettings.motionGestureEnabled,
      "touchGestureEnabled": DevMenuSettings.touchGestureEnabled,
      "keyCommandsEnabled": DevMenuSettings.keyCommandsEnabled,
      "showsAtLaunch": DevMenuSettings.showsAtLaunch,
      "isOnboardingFinished": DevMenuSettings.isOnboardingFinished
    ]
  }
}

private func boolForKey(_ key: String) -> Bool {
  return UserDefaults.standard.bool(forKey: key)
}

private func setBool(_ value: Bool, forKey key: String) {
  UserDefaults.standard.set(value, forKey: key)
}
