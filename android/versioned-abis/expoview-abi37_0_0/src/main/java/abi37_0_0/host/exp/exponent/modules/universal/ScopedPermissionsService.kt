package abi37_0_0.host.exp.exponent.modules.universal

import android.content.Context
import abi37_0_0.expo.modules.permissions.PermissionsService
import abi37_0_0.org.unimodules.interfaces.permissions.PermissionsResponseListener

class ScopedPermissionsService(context: Context) : PermissionsService(context) {
  // We override this to inject scoped permissions even if the device doesn't support the runtime permissions.
  override fun askForManifestPermissions(permissions: Array<out String>, listener: PermissionsResponseListener) {
    delegateRequestToActivity(permissions, listener)
  }

}
