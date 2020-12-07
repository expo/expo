package expo.modules.devlauncher.modules

import android.content.Intent
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import expo.modules.devlauncher.DevLauncherController.Companion.instance
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

private val cameraPackages = listOf(
  "com.sec.android.app.camera",
  "com.android.app.camera",
  "com.android.camera",
  "com.mediatek.camera",
  "com.android.camera2",
  "com.android.app.camera2",
  "com.meizu.media.camera",
  "com.htc.camera",
  "com.oppo.camera",
  "com.lge.camera",
  "com.google.android.GoogleCamera",
  "com.motorola.Camera",
  "com.google.android.camera",
  "com.sonyericsson.android.camera",
  "com.samsung.android.camera"
)

private const val ON_NEW_DEEP_LINK_EVENT = "expo.modules.devlauncher.onnewdeeplink"

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

    // We can't just trigger default intent for camera, because we don't have `CAMERA` permissions.
    // Firstly, we try to get a package that handles the default camera intent...
    Intent(MediaStore.ACTION_IMAGE_CAPTURE)
      .resolveActivity(packageManager)
      ?.let { componentName ->
        // ...then we search for the launcher intent.
        // However, this approach might fail...
        packageManager
          .getLaunchIntentForPackage(componentName.packageName)
          ?.let {
            reactApplicationContext.startActivity(it)
            promise.resolve(null)
            return
          }
      }

    // ...if so, we can fallback to the hardcoded packages list.
    // A lot of custom ROMs do it in the same way.
    cameraPackages.forEach { cameraPackage ->
      reactApplicationContext
        .packageManager
        .getLaunchIntentForPackage(cameraPackage)
        ?.let {
          reactApplicationContext.startActivity(it)
          promise.resolve(null)
          return
        }
    }
    promise.reject("ERR_DEVELOPMENT_CLIENT_CANNOT_OPEN_CAMERA", "Couldn't find the camera app.")
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
}
