package abi37_0_0.expo.modules.permissions.requesters

import android.os.Bundle
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsResponse
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.EXPIRES_KEY
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.CAN_ASK_AGAIN_KEY
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.GRANTED_KEY
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.PERMISSION_EXPIRES_NEVER
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsResponse.Companion.STATUS_KEY
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsStatus

class RemindersRequester : PermissionRequester {
  override fun getAndroidPermissions(): List<String> = listOf()

  override fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle {
    return Bundle().apply {
      putString(STATUS_KEY, PermissionsStatus.GRANTED.status)
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
      putBoolean(CAN_ASK_AGAIN_KEY, true)
      putBoolean(GRANTED_KEY, true)
    }
  }
}
