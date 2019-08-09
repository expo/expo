package expo.modules.permissions.requesters

import android.os.Build
import android.os.Bundle
import android.provider.Settings
import expo.modules.permissions.PermissionsTypes.SYSTEM_BRIGHTNESS
import expo.modules.permissions.DENIED_VALUE
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.PERMISSION_EXPIRES_NEVER
import expo.modules.permissions.PermissionsService
import expo.modules.permissions.STATUS_KEY
import expo.modules.permissions.UNDETERMINED_VALUE
import org.unimodules.core.interfaces.ActivityProvider

class SystemBrightnessRequester(private val permissionsService: PermissionsService,
                                private val activityProvider: ActivityProvider) : PermissionRequester {
  override fun getAndroidPermissions(): Array<String> = emptyArray() // this permission is handled in different way

  // checkSelfPermission does not return accurate status of WRITE_SETTINGS
  override fun getPermission(): Bundle {
    return Bundle().apply {
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putString(STATUS_KEY, when {
        hasWritePermission() -> {
          GRANTED_VALUE
        }
        permissionsService.didAsk(SYSTEM_BRIGHTNESS.type) -> {
          DENIED_VALUE
        }
        else -> {
          UNDETERMINED_VALUE
        }
      })
    }
  }

  private fun hasWritePermission(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Settings.System.canWrite(activityProvider.currentActivity.applicationContext)
    } else {
      true
    }
  }
}
