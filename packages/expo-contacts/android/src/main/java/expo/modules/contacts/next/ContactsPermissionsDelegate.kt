package expo.modules.contacts.next

import android.Manifest
import expo.modules.contacts.MissingPermissionException
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

class ContactsPermissionsDelegate(appContext: AppContext) {
  private val weakAppContextRef = WeakReference(appContext)

  private val permissionsManager
    get() = weakAppContextRef.get()?.permissions
      ?: throw Exceptions.PermissionsModuleNotFound()

  fun requestPermissions(promise: Promise) {
    val permissionsInManifest = if (permissionsManager.isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      arrayOf(Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS)
    } else {
      arrayOf(Manifest.permission.READ_CONTACTS)
    }
    Permissions.askForPermissionsWithPermissionsManager(permissionsManager, promise, *permissionsInManifest)
  }

  fun getPermissions(promise: Promise) {
    val permissionsInManifest = if (permissionsManager.isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      arrayOf(Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS)
    } else {
      arrayOf(Manifest.permission.READ_CONTACTS)
    }
    Permissions.getPermissionsWithPermissionsManager(permissionsManager, promise, *permissionsInManifest)
  }

  fun ensureReadPermission() {
    val hasPermission = permissionsManager.hasGrantedPermissions(Manifest.permission.READ_CONTACTS)
    if (!hasPermission) {
      throw MissingPermissionException(Manifest.permission.READ_CONTACTS)
    }
  }

  fun ensureWritePermission() {
    val hasPermission = permissionsManager.hasGrantedPermissions(Manifest.permission.WRITE_CONTACTS)
    if (!hasPermission) {
      throw MissingPermissionException(Manifest.permission.WRITE_CONTACTS)
    }
  }

  fun ensurePermissions() {
    ensureReadPermission()
    ensureWritePermission()
  }
}
