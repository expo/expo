package expo.modules.devmenu

import android.app.Application
import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView
import java.util.*


class DevMenuActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    DevMenuManager.devMenuHasOpened(this)
  }

  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : ReactActivityDelegate(this, mainComponentName) {
      override fun getReactNativeHost(): ReactNativeHost {
        return DevMenuManager.getDevMenuHost()
      }

      override fun getLaunchOptions(): Bundle? {
        val bundle = Bundle()
        bundle.putBoolean("enableDevelopmentTools", true)
        bundle.putBoolean("showOnboardingView", false)
        bundle.putParcelableArray("devMenuItems", arrayOfNulls<Bundle>(0))
        bundle.putString("uuid", UUID.randomUUID().toString())
        bundle.putBundle("appInfo", guessAppInfo(application))
        return bundle
      }

      override fun createRootView() = RNGestureHandlerEnabledRootView(this@DevMenuActivity)
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    DevMenuManager.devMenuHasBeenDestroyed()
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    when (keyCode) {
      KeyEvent.KEYCODE_T -> {
        DevMenuManager.closeMenu()
        return true
      }
    }
    return super.onKeyDown(keyCode, event)
  }

  override fun onPause() {
    super.onPause()
    overridePendingTransition(0, 0)
  }
}

fun guessAppInfo(application: Application): Bundle {
  return Bundle().apply {
    putCharSequence("appName", application.packageManager.getApplicationLabel(application.applicationInfo))
    putInt("appVersion", BuildConfig.VERSION_CODE) // todo: pass app version not dev menu version
//    application.packageManager.getApplicationIcon(application.applicationInfo)
//    application.applicationInfo.loadIcon(application.packageManager)
    putString("appIcon", resourceToUri(application, application.applicationInfo.icon).toString())
    putString("hostUrl", null)
//    "appName": infoDictionary["CFBundleDisplayName"] ?? infoDictionary["CFBundleExecutable"],
//    "appVersion": infoDictionary["CFBundleVersion"],
//    "appIcon": findAppIconPath(),
//    "hostUrl": bridge.bundleURL?.absoluteString ?? NSNull(),
  }
}

fun resourceToUri(context: Context, resID: Int): Uri? {
  return Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" +
    context.resources.getResourcePackageName(resID) + '/' +
    context.resources.getResourceTypeName(resID) + '/' +
    context.resources.getResourceEntryName(resID))
}
