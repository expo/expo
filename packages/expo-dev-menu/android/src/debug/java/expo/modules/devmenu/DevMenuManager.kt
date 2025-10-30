package expo.modules.devmenu

import expo.modules.manifests.core.Manifest

const val DEV_MENU_TAG = "ExpoDevMenu"

object DevMenuManager {
  var canLaunchDevMenuOnStart = true
    private set

  private var goToHomeAction: () -> Unit = {}

  var currentManifest: Manifest? = null
  var currentManifestURL: String? = null
  var launchUrl: String? = null

  private fun hasDisableOnboardingQueryParam(urlString: String): Boolean {
    return urlString.contains("disableOnboarding=1")
  }

  fun shouldDisableOnboarding(): Boolean {
    return hasDisableOnboardingQueryParam(currentManifestURL.orEmpty()) ||
      hasDisableOnboardingQueryParam(launchUrl.orEmpty())
  }

  fun goToHome() {
    goToHomeAction()
  }

  fun setGoToHomeAction(action: () -> Unit) {
    goToHomeAction = action
  }

  fun setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart: Boolean) {
    this.canLaunchDevMenuOnStart = canLaunchDevMenuOnStart
  }
}

