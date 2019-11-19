package abi36_0_0.expo.modules.permissions.requesters

import android.os.Bundle
import abi36_0_0.org.unimodules.interfaces.permissions.PermissionsResponse
import abi36_0_0.org.unimodules.interfaces.permissions.PermissionsStatus

interface PermissionRequester {
  fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle

  fun getAndroidPermissions(): List<String>
}
