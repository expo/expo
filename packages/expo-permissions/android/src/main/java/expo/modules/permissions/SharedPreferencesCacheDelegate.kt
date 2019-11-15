package expo.modules.permissions

import android.content.SharedPreferences

class SharedPreferencesCacheDelegate(private val mAskedPermissionsCache: SharedPreferences) : PermissionsCacheDelegate {

  override fun contains(permission: String): Boolean = mAskedPermissionsCache.getBoolean(permission, false)

  override fun add(permissions: List<String>) {
    with(mAskedPermissionsCache.edit()) {
      permissions.forEach { putBoolean(it, true) }
      apply()
    }
  }
}
