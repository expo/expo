package expo.modules.permissions

import org.unimodules.core.ModuleRegistry
import org.unimodules.interfaces.permissions.PermissionsListener
import org.unimodules.interfaces.permissions.PermissionsManager

private const val PERMISSIONS_REQUEST: Int = 13

class PermissionsRequester(moduleRegistry: ModuleRegistry) {
    private val mPermissionsManager: PermissionsManager? = moduleRegistry.getModule(PermissionsManager::class.java)
  
    internal fun askForPermissions(permissions: Array<out String>, listener: PermissionsListener): Boolean {
      if (mPermissionsManager != null) {
          mPermissionsManager.requestPermissions(permissions, PERMISSIONS_REQUEST, listener)
          return true
      }
      return false
    }
}