package abi49_0_0.expo.modules.permissions.requesters

import android.os.Bundle
import abi49_0_0.expo.modules.interfaces.permissions.PermissionsResponse

interface PermissionRequester {
  fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsResponse>): Bundle

  fun getAndroidPermissions(): List<String>
}
