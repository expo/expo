package expo.modules.permissions.requesters

import android.os.Bundle

interface PermissionRequester {
  fun getPermission(): Bundle

  fun getAndroidPermissions(): Array<String>
}
