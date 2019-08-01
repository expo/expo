package expo.modules.permissions.requesters

import android.os.Bundle
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.PERMISSION_EXPIRES_NEVER
import expo.modules.permissions.STATUS_KEY

class RemindersRequester : PermissionRequester {
  override fun getPermissionToAsk(): Array<String> = emptyArray()


  override fun getPermission(): Bundle {
    return Bundle().apply {
      putString(STATUS_KEY, GRANTED_VALUE)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}