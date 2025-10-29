package expo.modules.devmenu

import android.app.Activity
import android.content.Context
import android.os.Bundle
import com.facebook.react.ReactHost
import expo.modules.devmenu.api.DevMenuMetroClient
import expo.modules.manifests.core.Manifest
import kotlinx.coroutines.CoroutineScope

const val DEV_MENU_TAG = "[disabled] ExpoDevMenu"

private const val DEV_MENU_IS_NOT_AVAILABLE = "DevMenu isn't available in release builds"

object DevMenuManager {
  data class KeyCommand(val code: Int, val withShift: Boolean = false)

  internal var delegate: DevMenuDefaultDelegate? = null

  var currentManifest: Manifest? = null
  var currentManifestURL: String? = null

  data class Callback(val name: String, val shouldCollapse: Boolean)

  var registeredCallbacks = arrayListOf<Callback>()

  fun getReactHost(): ReactHost? {
    return null
  }

  fun getAppInfo(): Bundle {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun getDevSettings(): DevToolsSettings {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  val metroClient: DevMenuMetroClient by lazy {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun openMenu(activity: Activity) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun closeMenu() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun hideMenu() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun toggleMenu(activity: Activity) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun setDelegate(newDelegate: DevMenuDefaultDelegate) = Unit

  fun initializeWithReactHost(reactHost: ReactHost) = Unit

  fun getSettings(): DevMenuPreferencesHandle? {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun getMenuPreferences(): Bundle {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun synchronizeDelegate() = Unit

  fun setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart: Boolean) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun sendEventToDelegateBridge(eventName: String, eventData: Any?) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun isInitialized(): Boolean {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun loadFonts(context: Context) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  val coroutineScope: CoroutineScope
    get() = throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)

  fun reload() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun goToHome() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun togglePerformanceMonitor() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun toggleInspector() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun openJSInspector() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun toggleFastRefresh() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun toggleFab() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun refreshCustomItems() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }
}
