package expo.modules.devmenu.modules.internals

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.google.gson.Gson
import expo.modules.devmenu.modules.DevMenuInternalSessionManagerModuleInterface
import expo.modules.devmenu.modules.DevMenuManagerProvider
import org.json.JSONObject

private const val UserLoginEvent = "expo.dev-menu.user-login"
private const val UserLogoutEvent = "expo.dev-menu.user-logout"

private const val SessionKey = "expo-dev-menu.session"

private const val SessionStore = "expo.modules.devmenu.sessionstore"

class DevMenuInternalSessionManagerModule(
  private val reactContext: ReactApplicationContext
) : DevMenuInternalSessionManagerModuleInterface {
  private val devMenuManger by lazy {
    reactContext
      .getNativeModule(DevMenuManagerProvider::class.java)!!
      .getDevMenuManager()
  }

  private val localStore = reactContext.getSharedPreferences(SessionStore, Context.MODE_PRIVATE)

  override fun restoreSession(): String? {
    return getSessionFromLocalStorage()?.let {
      try {
        val session = JSONObject(it)
        val sessionSecret = session.optString("sessionSecret")
        setSessionSecret(sessionSecret)
        return@let it
      } catch (e: Exception) {
        Log.w("ExpoDevMenu", e.message, e)
        return@let null
      }
    }
  }

  override fun restoreSessionAsync(promise: Promise) {
    promise.resolve(restoreSession())
  }

  override fun setSessionAsync(session: ReadableMap?, promise: Promise) {
    if (session != null && !session.hasKey("sessionSecret")) {
      promise.reject("ERR_DEVMENU_CANNOT_SAVE_SESSION", "Session doesn't contain 'sessionSecret'.", null)
      return
    }

    setSessionSecret(session?.getString("sessionSecret"))

    val json = Gson().toJson(session?.toHashMap())
    saveSessionToLocalStorage(json)
    promise.resolve(null)
  }

  private fun setSessionSecret(sessionSecret: String?) {
    val wasLoggedIn = devMenuManger.getExpoApiClient().isLoggedIn()
    devMenuManger.getExpoApiClient().setSessionSecret(sessionSecret)
    val isLoggedIn = devMenuManger.getExpoApiClient().isLoggedIn()

    val eventName = if (!wasLoggedIn && isLoggedIn) {
      UserLoginEvent
    } else if (wasLoggedIn && !isLoggedIn) {
      UserLogoutEvent
    } else {
      null
    }

    eventName?.let {
      devMenuManger.sendEventToDelegateBridge(it, null)
    }
  }

  private fun getSessionFromLocalStorage(): String? {
    return localStore.getString(SessionKey, null)
  }

  private fun saveSessionToLocalStorage(data: String?) {
    localStore
      .edit()
      .putString(SessionKey, data)
      .apply()
  }
}
