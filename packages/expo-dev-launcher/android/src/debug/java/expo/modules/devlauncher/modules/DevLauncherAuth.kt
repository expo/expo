package expo.modules.devlauncher.modules

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.facebook.react.bridge.*
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devmenu.DevMenuManager

private const val SessionKey = "expo-dev-menu.session"
private const val SessionStore = "expo.modules.devmenu.sessionstore"

class DevLauncherAuth(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), DevLauncherKoinComponent {

  private val localStore = reactApplicationContext.getSharedPreferences(SessionStore, Context.MODE_PRIVATE)

  override fun getName(): String {
    return "EXDevLauncherAuth"
  }

  @ReactMethod
  fun setSessionAsync(session: String?, promise: Promise) {
    saveSessionToLocalStorage(session)
    promise.resolve(null)
  }

  private fun saveSessionToLocalStorage(data: String?) {
    localStore
      .edit()
      .putString(SessionKey, data)
      .apply()
  }

  @ReactMethod
  fun restoreSessionAsync(promise: Promise) {
    if (localStore.contains(SessionKey)) {
      val session = localStore.getString(SessionKey, null)
      return promise.resolve(session)
    }

    return promise.resolve("")
  }

  @ReactMethod
  fun openWebBrowserAsync(startUrl: String?, promise: Promise) {
    requireNotNull(startUrl)

    val intent = createCustomTabsIntent()
    intent.data = Uri.parse(startUrl)

    reactApplicationContext.currentActivity?.let {
      it.startActivity(intent)
      promise.resolve(null)
      return
    }

    promise.reject("ERR_DEVMENU_CANNOT_OPEN_BROWSER", "Current activity is null.")
  }

  private fun createCustomTabsIntent(): Intent {
    val builder = CustomTabsIntent.Builder()
    builder.setShowTitle(false)

    val intent = builder.build().intent

    // We cannot use builder's method enableUrlBarHiding, because there is no corresponding disable method and some browsers enables it by default.
    intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, false)

    return intent
  }
}
