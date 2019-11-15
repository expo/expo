package expo.modules.permissions

import android.content.Context
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.UIManager
import org.unimodules.interfaces.permissions.Permissions
import org.unimodules.interfaces.permissions.PermissionsResponseListener

private const val PERMISSIONS_REQUEST: Int = 13
private const val PREFERENCE_FILENAME = "expo.modules.permissions.asked"

class PermissionsInternalModule(val context: Context): InternalModule, Permissions {

  lateinit var mPermissionsService: Permissions

  override fun getExportedInterfaces(): List<Class<out Any>> = listOf(Permissions::class.java)

  @Throws(IllegalStateException::class)
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    val activityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
        ?: throw IllegalStateException("Couldn't find implementation for ActivityProvider.")
    val activityDelegate = AwareActivityDelegate(activityProvider, PERMISSIONS_REQUEST)
    val askedPermissionsCache = SharedPreferencesCacheDelegate(context.applicationContext.getSharedPreferences(PREFERENCE_FILENAME, Context.MODE_PRIVATE))
    mPermissionsService = PermissionsService(context, askedPermissionsCache, activityDelegate)
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(mPermissionsService as LifecycleEventListener)
  }

  override fun getPermissionsWithPromise(promise: Promise?, vararg permissions: String?) {
    mPermissionsService.getPermissionsWithPromise(promise, *permissions)
  }

  override fun getPermissions(response: PermissionsResponseListener?, vararg permissions: String?) {
    mPermissionsService.getPermissions(response, *permissions)
  }

  override fun askForPermissionsWithPromise(promise: Promise?, vararg permissions: String?) {
    mPermissionsService.askForPermissionsWithPromise(promise, *permissions)
  }

  override fun askForPermissions(response: PermissionsResponseListener?, vararg permissions: String?) {
    mPermissionsService.askForPermissions(response, *permissions)
  }

  override fun hasGrantedPermissions(vararg permissions: String?): Boolean {
    return mPermissionsService.hasGrantedPermissions(*permissions)
  }

  override fun isPermissionPresentInManifest(permission: String?): Boolean {
    return mPermissionsService.isPermissionPresentInManifest(permission)
  }


}
