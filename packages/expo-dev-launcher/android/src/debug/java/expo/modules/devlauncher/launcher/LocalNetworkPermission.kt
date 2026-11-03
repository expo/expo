package expo.modules.devlauncher.launcher

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build

// Android 17 blocks dev server traffic and discovery until the app holds the permission React Native's debug manifest declares.
internal object LocalNetworkPermission {
  const val PERMISSION = "android.permission.ACCESS_LOCAL_NETWORK"
  const val REQUEST_CODE = 0x4c4e

  private const val FIRST_ENFORCED_SDK = 37

  private var wasRequested = false

  private fun isRequired(context: Context): Boolean =
    Build.VERSION.SDK_INT >= FIRST_ENFORCED_SDK &&
      context.checkSelfPermission(PERMISSION) != PackageManager.PERMISSION_GRANTED

  // Asks once per process, so the launcher does not ask again right after a denial at startup.
  fun requestIfNeeded(activity: Activity, request: () -> Unit): Boolean {
    if (wasRequested || !isRequired(activity)) {
      return false
    }
    wasRequested = true
    request()
    return true
  }
}
