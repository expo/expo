package expo.modules.permissions.requesters

import android.os.Build
import android.os.Bundle
import android.provider.Settings
import expo.modules.permissions.PermissionsModule
import expo.modules.permissions.DENIED_VALUE
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.PERMISSION_EXPIRES_NEVER
import expo.modules.permissions.STATUS_KEY
import expo.modules.permissions.UNDETERMINED_VALUE
import org.unimodules.core.interfaces.ActivityProvider

class SystemBrightnessRequester(private val activityProvider: ActivityProvider) : PermissionRequester {
  override fun getPermissionToAsk(): Array<String> = emptyArray() // this permission is handling in different way

  // checkSelfPermission does not return accurate status of WRITE_SETTINGS
  override fun getPermission(): Bundle {
    return Bundle().apply {
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        when {
          Settings.System.canWrite(activityProvider.currentActivity.applicationContext) -> {
            putString(STATUS_KEY, GRANTED_VALUE)
          }
          PermissionsModule.didAsk("systemBrightness") -> {
            putString(STATUS_KEY, DENIED_VALUE)
          }
          else -> {
            putString(STATUS_KEY, UNDETERMINED_VALUE)
          }
        }
      } else {
        putString(STATUS_KEY, GRANTED_VALUE)
      }
    }
  }
}