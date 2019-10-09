package org.unimodules.interfaces.permissions

data class PermissionsResponse(val status: PermissionsStatus,
                               val neverAskAgain: Boolean = false) {
  companion object {
    const val STATUS_KEY = "status"
    const val GRANTED_KEY = "granted"
    const val EXPIRES_KEY = "expires"
    const val NEVER_ASK_AGAIN_KEY = "neverAskAgain"
    const val PERMISSION_EXPIRES_NEVER = "never"
  }
}
