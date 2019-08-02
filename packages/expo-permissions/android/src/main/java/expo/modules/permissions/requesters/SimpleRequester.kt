package expo.modules.permissions.requesters

import android.os.Bundle

/**
 * Used for representing CAMERA, CONTACTS, AUDIO_RECORDING, SMS
 *
 */
class SimpleRequester(val permission: String) : PermissionRequester {
  override fun getPermissionToAsk(): Array<String> = arrayOf(permission)

  override fun getPermission(): Bundle {
    return PermissionRequester.getSimplePermission(permission)
  }
}