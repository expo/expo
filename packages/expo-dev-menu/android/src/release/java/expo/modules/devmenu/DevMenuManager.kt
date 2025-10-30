package expo.modules.devmenu

import expo.modules.manifests.core.Manifest

const val DEV_MENU_TAG = "[disabled] ExpoDevMenu"

private const val DEV_MENU_IS_NOT_AVAILABLE = "DevMenu isn't available in release builds"

object DevMenuManager {
  var canLaunchDevMenuOnStart = true
    private set

  private var goToHomeAction: () -> Unit = {}

  var currentManifest: Manifest? = null
  var currentManifestURL: String? = null
  var launchUrl: String? = null

  private fun hasDisableOnboardingQueryParam(urlString: String): Boolean {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun shouldDisableOnboarding(): Boolean {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun goToHome() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun setGoToHomeAction(action: () -> Unit) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart: Boolean) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }
}
