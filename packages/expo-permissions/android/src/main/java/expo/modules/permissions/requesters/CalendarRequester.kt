package expo.modules.permissions.requesters

import android.Manifest
import android.os.Bundle
import expo.modules.permissions.PermissionsService
import expo.modules.permissions.DENIED_VALUE
import expo.modules.permissions.EXPIRES_KEY
import expo.modules.permissions.GRANTED_VALUE
import expo.modules.permissions.PERMISSION_EXPIRES_NEVER
import expo.modules.permissions.PermissionsTypes.CALENDAR
import expo.modules.permissions.STATUS_KEY
import expo.modules.permissions.UNDETERMINED_VALUE

class CalendarRequester(private val permissionsService: PermissionsService) : PermissionRequester {
  override fun getPermissionToAsk(): Array<String> = arrayOf(
      Manifest.permission.READ_CALENDAR,
      Manifest.permission.WRITE_CALENDAR
  )

  override fun getPermission(): Bundle {
    return Bundle().apply {
      putString(STATUS_KEY, when {
        permissionsService.arePermissionsGranted(getPermissionToAsk()) -> {
          GRANTED_VALUE
        }
        permissionsService.didAsk(CALENDAR.type) -> {
          DENIED_VALUE
        }
        else -> {
          UNDETERMINED_VALUE
        }
      })
      putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER)
    }
  }
}
