package expo.modules.devmenu

import expo.modules.devmenu.launch.ExpoLaunchUrl

/**
 * Session-only dev menu switches read from the launch URL. Nothing here is persisted.
 * Mirrors `canLaunchDevMenuOnStart` and `canShowFloatingActionButton` on the iOS `DevMenuManager`.
 */
object DevMenuLaunchOverrides {
  // ponytail: sticky for the whole process on purpose. A per-launch reset would undo the legacy
  // EXDevMenuDisableAutoLaunch transport, which is applied once at startup.
  @Volatile
  var canLaunchDevMenuOnStart = true

  @Volatile
  var canShowFab = true

  fun apply(launch: ExpoLaunchUrl, preferences: DevMenuPreferences?) {
    if (launch.suppressesMenuAtLaunch) {
      canLaunchDevMenuOnStart = false
    }
    if (launch.hidesToolsButton) {
      canShowFab = false
    }
    if (launch.disablesOnboarding) {
      preferences?.isOnboardingFinished = true
    }
  }

  internal fun reset() {
    canLaunchDevMenuOnStart = true
    canShowFab = true
  }
}
