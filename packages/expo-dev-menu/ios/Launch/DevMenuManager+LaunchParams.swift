// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

extension DevMenuManager {
  /**
   Applies the dev menu params of a launch URL to the saved preferences: `__expo_disable_onboarding=1`,
   `__expo_disable_fab=1` and `__expo_disable_auto_launch=1`, or their legacy names next to `url`.
   */
  @objc(applyLaunchParamsFromURL:)
  public func applyLaunchParams(from url: URL) {
    let launch = ExpoLauncherURL(url)
    if launch.disablesOnboarding {
      DevMenuPreferences.isOnboardingFinished = true
    }
    if launch.disablesFab {
      setShowFloatingActionButton(false)
    }
    if launch.disablesAutoLaunch {
      DevMenuPreferences.isOnboardingFinished = true
      setShowsAtLaunch(false)
    }
  }
}
