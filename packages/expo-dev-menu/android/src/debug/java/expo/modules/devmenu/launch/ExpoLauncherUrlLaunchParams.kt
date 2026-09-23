package expo.modules.devmenu.launch

import expo.modules.devmenu.DevMenuPreferences

/**
 * Applies the dev menu params of a launch URL. `__expo_disable_onboarding` finishes onboarding in the
 * saved preferences; the other two are one-time switches for this process, see [DevMenuLaunchOverrides].
 */
fun ExpoLauncherUrl.applyDevMenuLaunchParams(preferences: DevMenuPreferences) {
  if (disablesOnboarding) {
    preferences.isOnboardingFinished = true
  }
  if (disablesFab) {
    DevMenuLaunchOverrides.canShowFab = false
  }
  if (disablesAutoLaunch) {
    DevMenuLaunchOverrides.canLaunchDevMenuOnStart = false
  }
}
