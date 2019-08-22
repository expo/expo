package expo.modules.permissions.requesters

import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsResponse.EXPIRES_KEY
import org.unimodules.interfaces.permissions.PermissionsResponse.PERMISSION_EXPIRES_NEVER
import org.unimodules.interfaces.permissions.PermissionsResponse.STATUS_KEY
import org.unimodules.interfaces.permissions.PermissionsStatus

class RemindersRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsStatus>): Bundle {
    return Bundle().apply {
      putString(STATUS_KEY, PermissionsStatus.GRANTED.jsString)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}
