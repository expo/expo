package expo.modules.calendar.next.permissions

import android.Manifest
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
class CalendarPermissionsDelegate(private val appContext: AppContext) {
  private fun hasReadPermissions(): Boolean {
    return appContext.permissions
      ?.hasGrantedPermissions(Manifest.permission.READ_CALENDAR) == true
  }
  
  private fun hasWritePermissions(): Boolean {
    return appContext.permissions
      ?.hasGrantedPermissions( Manifest.permission.WRITE_CALENDAR) == true
  }
  
  fun requireReadPermissions() {
    if (!hasReadPermissions()) {
      throw CodedException("Read permission not found")
    }
  }
  
  fun requireWritePermissions() {
    if (!hasWritePermissions()) {
      throw CodedException("Write permission not found")
    }
  }
  
  fun requireSystemPermissions(isWritePermissionRequired: Boolean = true) {
    if (isWritePermissionRequired) {
      requireWritePermissions()
    }
    requireReadPermissions()
  }
}
