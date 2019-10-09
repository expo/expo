package expo.modules.permissions.requesters

import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.NEVER_ASK_AGAIN_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

class RemindersRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      putString(STATUS_KEY, PermissionsStatus.GRANTED.jsString)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(NEVER_ASK_AGAIN_KEY, false)
    }
  }
}
