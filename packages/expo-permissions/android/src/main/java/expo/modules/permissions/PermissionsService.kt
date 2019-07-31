package expo.modules.permissions


import android.content.Context
import android.content.pm.PackageManager
import android.support.v4.content.ContextCompat
import com.facebook.react.modules.core.PermissionAwareActivity

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.interfaces.permissions.Permissions

private const val PERMISSIONS_REQUEST: Int = 13

open class PermissionsService(context: Context): InternalModule, Permissions {
  protected val mContext: Context = context
  private var mActivityProvider: ActivityProvider? = null

  override fun getExportedInterfaces(): List<Class<out Any>>
    = listOf<Class<out Any>>(Permissions::class.java)

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
  }

  override fun getPermissions(permissions: Array<String>): IntArray
    = IntArray(permissions.size) { i -> getPermission(permissions[i]) }

  override fun getPermission(permission: String): Int {
    val currentActivity = mActivityProvider?.currentActivity

    if (currentActivity != null && currentActivity is PermissionAwareActivity) {
      return ContextCompat.checkSelfPermission(currentActivity, permission)
    }
    return PackageManager.PERMISSION_DENIED
  }

  override fun askForPermissions(permissions: Array<String>, listener: Permissions.PermissionsRequestListener) {
    val currentActivity = mActivityProvider?.currentActivity

    if (currentActivity != null && currentActivity is PermissionAwareActivity) {
      val activity = currentActivity as PermissionAwareActivity
      activity.requestPermissions(permissions, PERMISSIONS_REQUEST) { requestCode, permissions, grantResults ->
        when (PERMISSIONS_REQUEST) {
          requestCode -> {
            listener.onPermissionsResult(grantResults)
            true
          }
          else -> {
            listener.onPermissionsResult(IntArray(permissions.size) { PackageManager.PERMISSION_DENIED })
            false
          }
        }
      }
    } else {
      listener.onPermissionsResult(IntArray(permissions.size) { PackageManager.PERMISSION_DENIED })
    }
  }

  override fun askForPermission(permission: String, listener: Permissions.PermissionRequestListener) {
    askForPermissions(arrayOf(permission)) { results: IntArray -> listener.onPermissionResult(results[0]) }
  }

  override fun hasPermissions(permissions: Array<String>): Boolean
    = getPermissions(permissions).all { permission -> permission == PackageManager.PERMISSION_GRANTED }

}
