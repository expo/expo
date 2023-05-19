package expo.modules.devmenu

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReactApplicationContext
import expo.interfaces.devmenu.DevMenuDelegateInterface
import expo.interfaces.devmenu.DevMenuManagerInterface
import expo.interfaces.devmenu.DevMenuPreferencesInterface
import expo.interfaces.devmenu.items.DevMenuDataSourceItem
import expo.modules.devmenu.api.DevMenuMetroClient
import kotlinx.coroutines.CoroutineScope
import expo.modules.manifests.core.Manifest

private const val DEV_MENU_IS_NOT_AVAILABLE = "DevMenu isn't available in release builds"

object DevMenuManager : DevMenuManagerInterface {
  internal var delegate: DevMenuDelegateInterface? = null

  var currentManifest: Manifest? = null
  var currentManifestURL: String? = null

  data class Callback(val name: String, val shouldCollapse: Boolean)

  var registeredCallbacks = arrayListOf<Callback>()

  fun getReactInstanceManager(): ReactInstanceManager? {
    return null
  }

  fun getAppInfo(): Bundle {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun getDevSettings(): Bundle {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  val metroClient: DevMenuMetroClient by lazy {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun openMenu(activity: Activity, screen: String?) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun closeMenu() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun hideMenu() {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun toggleMenu(activity: Activity) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun onKeyEvent(keyCode: Int, event: KeyEvent) = false

  override fun onTouchEvent(ev: MotionEvent?) = Unit

  override fun setDelegate(newDelegate: DevMenuDelegateInterface) = Unit

  override fun initializeWithReactNativeHost(reactNativeHost: ReactNativeHost) = Unit

  override fun dispatchCallable(actionId: String, args: ReadableMap?) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun serializedItems(): List<Bundle> {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun serializedScreens(): List<Bundle> {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun getSettings(): DevMenuPreferencesInterface? {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun getMenuPreferences(): Bundle {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun getMenuHost(): ReactNativeHost {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun synchronizeDelegate() = Unit

  override fun setCurrentScreen(screen: String?) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart: Boolean) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun sendEventToDelegateBridge(eventName: String, eventData: Any?) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override fun isInitialized(): Boolean {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override suspend fun fetchDataSource(id: String): List<DevMenuDataSourceItem> {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  fun loadFonts(context: Context) {
    throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
  }

  override val coroutineScope: CoroutineScope
    get() = throw IllegalStateException(DEV_MENU_IS_NOT_AVAILABLE)
}
