// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

private let motionGestureEnabledKey = "EXDevMenuMotionGestureEnabled"
private let touchGestureEnabledKey = "EXDevMenuTouchGestureEnabled"
private let keyCommandsEnabledKey = "EXDevMenuKeyCommandsEnabled"
private let showsAtLaunchKey = "EXDevMenuShowsAtLaunch"
private let isOnboardingFinishedKey = "EXDevMenuIsOnboardingFinished"
private let showFloatingActionButtonKey = "EXDevMenuShowFloatingActionButton"

class DevMenuPreferences {
  /*
   Initializes dev menu preferences by registering user defaults.
   */
  static func setup() {
    UserDefaults.standard.register(defaults: [
      motionGestureEnabledKey: true,
      touchGestureEnabledKey: true,
      keyCommandsEnabledKey: true,
      showsAtLaunchKey: false,
      isOnboardingFinishedKey: false,
      showFloatingActionButtonKey: true
    ])
  }

  /**
   Whether to enable shake gesture.
   */
  static var motionGestureEnabled: Bool {
    get {
      return UserDefaults.standard.bool(forKey: motionGestureEnabledKey)
    }
    set {
      UserDefaults.standard.set(newValue, forKey: motionGestureEnabledKey)
    }
  }

  /**
   Whether to enable three-finger long press gesture.
   */
  static var touchGestureEnabled: Bool {
    get {
      return UserDefaults.standard.bool(forKey: touchGestureEnabledKey)
    }
    set {
      UserDefaults.standard.set(newValue, forKey: touchGestureEnabledKey)
    }
  }

  /**
   Whether to enable key commands.
   */
  static var keyCommandsEnabled: Bool {
    get {
      return UserDefaults.standard.bool(forKey: keyCommandsEnabledKey)
    }
    set {
      UserDefaults.standard.set(newValue, forKey: keyCommandsEnabledKey)
    }
  }

  /**
   Whether to automatically show the dev menu once its delegate is set and the bridge is loaded.
   */
  static var showsAtLaunch: Bool {
    get {
      return UserDefaults.standard.bool(forKey: showsAtLaunchKey)
    }
    set {
      UserDefaults.standard.set(newValue, forKey: showsAtLaunchKey)
    }
  }

  /**
   Returns `true` only if the user finished onboarding, `false` otherwise.
   */
  static var isOnboardingFinished: Bool {
    get {
      return UserDefaults.standard.bool(forKey: isOnboardingFinishedKey)
    }
    set {
      UserDefaults.standard.set(newValue, forKey: isOnboardingFinishedKey)
    }
  }

  /**
   Whether to show the floating action button.
   */
  static var showFloatingActionButton: Bool {
    get {
      return UserDefaults.standard.bool(forKey: showFloatingActionButtonKey)
    }
    set {
      UserDefaults.standard.set(newValue, forKey: showFloatingActionButtonKey)
    }
  }
}
