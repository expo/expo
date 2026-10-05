// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

extension DevMenuManager {
  /**
   Applies the dev menu params of a launch URL. `__expo_disable_onboarding=1` finishes onboarding in the
   saved preferences. `__expo_disable_fab=1` and `__expo_disable_auto_launch=1` are one-time switches for
   this process and never touch the preferences.
   */
  @objc(applyLaunchParamsFromURL:)
  public func applyLaunchParams(from url: URL) {
    let launch = ExpoLauncherURL(url)
    if launch.disablesOnboarding {
      DevMenuPreferences.isOnboardingFinished = true
    }
    if launch.disablesFab {
      canShowFloatingActionButton = false
      updateFABVisibility()
    }
    if launch.disablesAutoLaunch {
      canLaunchDevMenuOnStart = false
      updateAutoLaunchObserver()
    }
  }
}
