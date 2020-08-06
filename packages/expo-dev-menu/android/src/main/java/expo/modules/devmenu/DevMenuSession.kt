package expo.modules.devmenu

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.os.Bundle
import androidx.core.content.pm.PackageInfoCompat
import com.facebook.react.ReactInstanceManager


class DevMenuSession(private val reactInstanceManager: ReactInstanceManager, initAppInfo: Bundle?) {
  val appInfo = initAppInfo ?: guessAppInfo()

  private fun guessAppInfo() = Bundle().apply {
    val reactContext = reactInstanceManager.currentReactContext ?: return@apply
    val applicationContext = reactContext.applicationContext
    putCharSequence("appName", guessAppName(applicationContext))
    putLong("appVersion", guessAppVersion(applicationContext)) // todo: pass app version not dev menu version
    putString("appIcon", guessAppIcon(applicationContext))
    putString("hostUrl", reactContext.catalystInstance?.sourceURL)
  }

  private fun guessAppName(context: Context): CharSequence {
    return context.packageManager.getApplicationLabel(context.applicationInfo)
  }

  private fun guessAppVersion(context: Context): Long {
    val manager = context.packageManager
    return try {
      val info = manager.getPackageInfo(context.packageName, 0)
      PackageInfoCompat.getLongVersionCode(info)
    } catch (e: Exception) {
      0
    }
  }

  private fun guessAppIcon(context: Context): String {
    val iconId = context.applicationInfo.icon

    return Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" +
      context.resources.getResourcePackageName(iconId) + '/' +
      context.resources.getResourceTypeName(iconId) + '/' +
      context.resources.getResourceEntryName(iconId)).toString()
  }
}
