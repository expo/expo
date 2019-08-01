package expo.modules.permissions.requesters

import android.os.Bundle


/**
 * Used for representing CAMERA, CONTACTS, AUDIORECORDING, SMS
 *
 */
class SimpleRequester(val permission: String) : PermissionRequester {
  override fun getPermissionToAsk(): Array<String> = arrayOf(permission)

  override fun getPermission(): Bundle {
    return PermissionRequester.getSimplePermission(permission)
  }
}