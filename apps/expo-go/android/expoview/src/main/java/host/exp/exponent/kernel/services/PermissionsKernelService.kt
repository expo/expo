package host.exp.exponent.kernel.services

import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.PermissionInfo
import expo.modules.jsonutils.getNullable
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.storage.ExponentSharedPreferences
import org.json.JSONException
import org.json.JSONObject

class PermissionsKernelService(
  context: Context,
  private val exponentSharedPreferences: ExponentSharedPreferences
) : BaseKernelService(context) {
  fun grantScopedPermissions(permission: String, experienceKey: ExperienceKey) {
    try {
      var metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey)
      if (metadata == null) {
        metadata = JSONObject()
      }
      val permissions: JSONObject = metadata.getNullable(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS) ?: JSONObject()
      val permissionObject: JSONObject = permissions.getNullable(permission) ?: JSONObject()
      permissionObject.put("status", "granted")
      permissions.put(permission, permissionObject)
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS, permissions)
      exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  fun revokeScopedPermissions(permission: String, experienceKey: ExperienceKey) {
    try {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: return
      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS)) {
        val permissions =
          metadata.getJSONObject(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS)
        if (permissions.has(permission)) {
          permissions.remove(permission)
          metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS, permissions)
          exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
        }
      }
    } catch (e: JSONException) {
      e.printStackTrace()
    }
  }

  fun hasGrantedPermissions(permission: String, experienceKey: ExperienceKey): Boolean {
    val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: return false
    try {
      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS)) {
        val permissions =
          metadata.getJSONObject(ExponentSharedPreferences.EXPERIENCE_METADATA_PERMISSIONS)
        if (permissions.has(permission)) {
          val permissionsObject = permissions.getJSONObject(permission)
          return permissionsObject.getNullable<String>("status") == "granted"
        }
      }
    } catch (e: JSONException) {
      e.printStackTrace()
    }
    return false
  }

  fun getPermissions(
    globalPermissionStatus: Int,
    packageManager: PackageManager,
    permission: String,
    experienceKey: ExperienceKey
  ): Int {
    // only these permissions, which show a dialog to the user should be scoped.
    val isDangerousPermission: Boolean = try {
      isDangerousPermission(permission, packageManager)
    } catch (e: PackageManager.NameNotFoundException) {
      return PackageManager.PERMISSION_DENIED
    }
    if (!isDangerousPermission) {
      return globalPermissionStatus
    }
    return if (globalPermissionStatus == PackageManager.PERMISSION_GRANTED &&
      hasGrantedPermissions(permission, experienceKey)
    ) {
      PackageManager.PERMISSION_GRANTED
    } else {
      PackageManager.PERMISSION_DENIED
    }
  }

  @Throws(PackageManager.NameNotFoundException::class)
  private fun isDangerousPermission(permission: String, packageManager: PackageManager): Boolean {
    val permissionInfo = packageManager.getPermissionInfo(permission, PackageManager.GET_META_DATA)
    return permissionInfo.protectionLevel and PermissionInfo.PROTECTION_DANGEROUS != 0
  }

  override fun onExperienceForegrounded(experienceKey: ExperienceKey) {}
  override fun onExperienceBackgrounded(experienceKey: ExperienceKey) {}
}
