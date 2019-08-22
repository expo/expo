package expo.modules.permissions.requesters

import android.os.Bundle
import org.unimodules.interfaces.permissions.PermissionsStatus

interface PermissionRequester {
  fun parseAndroidPermissions(permissionsResponse: Map<String, PermissionsStatus>): Bundle

  fun getAndroidPermissions(): List<String>
}
