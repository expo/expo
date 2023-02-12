package abi47_0_0.expo.modules.permissions.requesters

import android.os.Bundle
import abi47_0_0.expo.modules.interfaces.permissions.PermissionsResponse

interface PermissionRequester {
  fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle

  fun getAndroidPermissions(): List<String>
}
