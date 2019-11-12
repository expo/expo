package expo.modules.permissions.requesters

import android.content.Context
import android.os.Bundle
import androidx.core.app.NotificationManagerCompat
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

class NotificationRequester(private val context: Context) : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      val areEnabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
      putString(STATUS_KEY, if (areEnabled) PermissionsStatus.GRANTED.status else PermissionsStatus.DENIED.status)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, true)
      putBoolean(GRANTED_KEY, true)
    }
  }
}
