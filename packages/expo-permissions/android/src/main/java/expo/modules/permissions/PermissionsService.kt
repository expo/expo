package expo.modules.permissions

import android.content.Context
import android.content.pm.PackageManager
import android.support.v4.content.ContextCompat


import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.interfaces.permissions.Permissions
import org.unimodules.interfaces.permissions.PermissionsListener
import kotlin.properties.Delegates

open class PermissionsService(context: Context): InternalModule, Permissions {

  protected val mContext: Context = context
  private var mPermissionsRequester: PermissionsRequester by Delegates.notNull()


  override fun getExportedInterfaces(): List<Class<out Any>>
      = listOf<Class<out Any>>(Permissions::class.java)



  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mPermissionsRequester = PermissionsRequester(moduleRegistry)
  }

  override fun getPermissions(permissions: Array<String>): IntArray
    = IntArray(permissions.size) { i -> getPermission(permissions[i])}


  override fun getPermission(permission: String): Int
    = ContextCompat.checkSelfPermission(mContext, permission)


  override fun askForPermissions(permissions: Array<String>, listener: Permissions.PermissionsRequestListener) {
    val askedPermissions = mPermissionsRequester.askForPermissions(
      permissions,
      PermissionsListener { _, grantResults -> listener.onPermissionsResult(grantResults) }
    )
    if (!askedPermissions) {
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
