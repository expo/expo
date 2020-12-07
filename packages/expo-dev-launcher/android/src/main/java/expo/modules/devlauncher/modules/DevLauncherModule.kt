package expo.modules.devlauncher.modules

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import expo.modules.devlauncher.DevLauncherController.Companion.instance
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

private const val ON_NEW_DEEP_LINK_EVENT = "expo.modules.devlauncher.onnewdeeplink"
private const val CLIENT_PACKAGE_NAME = "host.exp.exponent"

class DevLauncherModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
  override fun initialize() {
    super.initialize()
    instance.pendingIntentRegistry.subscribe(this::onNewPendingIntent)
  }

  override fun invalidate() {
    super.invalidate()
    instance.pendingIntentRegistry.unsubscribe(this::onNewPendingIntent)
  }

  override fun getName(): String {
    return "EXDevLauncher"
  }

  override fun hasConstants(): Boolean {
    return true
  }

  @ReactMethod
  fun loadApp(url: String, promise: Promise) {
    GlobalScope.launch {
      try {
        instance.loadApp(url)
      } catch (e: Exception) {
        promise.reject(e)
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getRecentlyOpenedApps(promise: Promise) {
    promise.resolve(Arguments
      .createMap()
      .apply {
        instance.getRecentlyOpenedApps().forEach { (key, value) ->
          putString(key, value)
        }
      })
  }

  @ReactMethod
  fun openCamera(promise: Promise) {
    val packageManager = reactApplicationContext.packageManager

    packageManager.getLaunchIntentForPackage(CLIENT_PACKAGE_NAME)
      ?.let {
        reactApplicationContext.startActivity(it)
        promise.resolve(null)
        return
      }

    // try to open the Play Store app...
    if (openLink(Uri.parse("market://details?id=$CLIENT_PACKAGE_NAME"))) {
      return
    }

    // ...app isn't installed so fallback to the Play Store website
    if (openLink(Uri.parse("https://play.google.com/store/apps/details?id=$CLIENT_PACKAGE_NAME"))) {
      return
    }
    
    promise.reject("ERR_DEVELOPMENT_CLIENT_CANNOT_OPEN_CAMERA", "Couldn't find the Expo Go app.")
  }

  @ReactMethod
  fun getPendingDeepLink(promise: Promise) {
    promise.resolve(instance.pendingIntentRegistry.intent?.data?.toString())
  }

  private fun onNewPendingIntent(intent: Intent) {
    intent.data?.toString()?.let {
      reactApplicationContext
        .getJSModule(RCTDeviceEventEmitter::class.java)
        .emit(ON_NEW_DEEP_LINK_EVENT, it)
    }
  }

  private fun openLink(uri: Uri): Boolean {
    return try {
      reactApplicationContext.startActivity(
        Intent(Intent.ACTION_VIEW, uri).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
      )
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }
}
