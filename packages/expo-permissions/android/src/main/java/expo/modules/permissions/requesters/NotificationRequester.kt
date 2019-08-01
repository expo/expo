package expo.modules.permissions.requesters

import android.content.Context
import android.os.Bundle
import android.support.v4.app.NotificationManagerCompat
import expo.modules.permissions.DENIED_VALUE
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.PERMISSION_EXPIRES_NEVER
import expo.modules.permissions.STATUS_KEY

class NotificationRequester(private val context: Context) : PermissionRequester{
  override fun getPermissionToAsk(): Array<String> = emptyArray()

  override fun getPermission(): Bundle {
    return Bundle().apply {
      val areEnabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
      putString(STATUS_KEY, if (areEnabled) GRANTED_VALUE else DENIED_VALUE)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}