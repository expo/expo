package expo.modules.devmenu.launch

import expo.modules.devmenu.DevMenuPreferences

/**
 * Applies the dev menu params of a launch URL to the saved preferences, the same way the launcher
 * Settings screen would. The changes persist until the user re-enables the setting in the dev menu.
 */
fun ExpoLauncherUrl.applyDevMenuPreferences(preferences: DevMenuPreferences) {
  if (disablesOnboarding) {
    preferences.isOnboardingFinished = true
  }
  if (disablesFab) {
    preferences.showFab = false
  }
  if (disablesAutoLaunch) {
    preferences.isOnboardingFinished = true
    preferences.showsAtLaunch = false
  }
}
