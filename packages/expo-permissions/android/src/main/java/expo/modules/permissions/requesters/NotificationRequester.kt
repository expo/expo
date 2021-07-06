package expo.modules.permissions.requesters

import android.content.Context
import android.os.Bundle
import androidx.core.app.NotificationManagerCompat
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import expo.modules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import expo.modules.interfaces.permissions.PermissionsStatus

class NotificationRequester(private val context: Context) : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      val areEnabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
      putString(STATUS_KEY, if (areEnabled) PermissionsStatus.GRANTED.status else PermissionsStatus.DENIED.status)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      // If notifications aren't enabled, the user needs to activate them in system options. So, we should set `CAN_ASK_AGAIN_KEY` to false if this is the case.
      // Otherwise, it can be set to true.
      putBoolean(CAN_ASK_AGAIN_KEY, areEnabled)
      putBoolean(GRANTED_KEY, areEnabled)
    }
  }
}
