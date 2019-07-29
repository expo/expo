package expo.modules.permissions


import android.content.Context
import android.content.pm.PackageManager
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.interfaces.permissions.Permissions
import org.unimodules.interfaces.permissions.PermissionsManager

private const val PERMISSIONS_REQUEST: Int = 13

open class PermissionsService(context: Context): InternalModule, Permissions {
  private var mPermissionsManager: PermissionsManager? = null
  private var mPermissions :Permissions? = null
  protected val mContext: Context = context

  override fun getExportedInterfaces(): List<Class<out Any>>
      = listOf<Class<out Any>>(Permissions::class.java)

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mPermissionsManager = moduleRegistry.getModule(PermissionsManager::class.java)
    mPermissions = moduleRegistry.getModule(Permissions::class.java)
  }

  override fun getPermissions(permissions: Array<String>): IntArray
    = IntArray(permissions.size) { i -> getPermission(permissions[i]) }

  override fun getPermission(permission: String): Int
    = mPermissions?.getPermission(permission) ?: PackageManager.PERMISSION_DENIED

  override fun askForPermissions(permissions: Array<String>, listener: Permissions.PermissionsRequestListener) {
    val askedPermissions = mPermissionsManager?.requestPermissions(
      permissions,
      PERMISSIONS_REQUEST
    ) { _, grantResults -> listener.onPermissionsResult(grantResults) }

    if (askedPermissions == null || !askedPermissions) {
      val results = IntArray(permissions.size) { PackageManager.PERMISSION_DENIED }
      listener.onPermissionsResult(results)
    }
  }

  override fun askForPermission(permission: String, listener: Permissions.PermissionRequestListener) {
    askForPermissions(arrayOf(permission)) { results: IntArray -> listener.onPermissionResult(results[0]) }
  }

  override fun hasPermissions(permissions: Array<String>): Boolean
    = getPermissions(permissions).all { permission -> permission == PackageManager.PERMISSION_GRANTED }

}
