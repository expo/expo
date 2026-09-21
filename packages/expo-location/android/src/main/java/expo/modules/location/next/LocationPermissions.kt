package expo.modules.location.next

import android.Manifest
import android.os.Build
import androidx.annotation.ChecksSdkIntAtLeast
import expo.modules.kotlin.exception.CodedException
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import kotlinx.coroutines.CompletableDeferred

class NoPermissionsModuleException :
  CodedException("Permissions module is null. Are you sure all the installed Expo modules are properly linked?")

class NoPermissionInManifestException(permissionName: String) :
  CodedException("You need to add `$permissionName` to the AndroidManifest")

class ForegroundLocationPermissionsNotGrantedException :
  CodedException("Foreground location permissions are not granted. Call requestForegroundPermissions() and make sure the user grants precise or approximate location.")

class BackgroundLocationPermissionsNotGrantedException :
  CodedException("Background location permissions are not granted. Call requestBackgroundPermissions() after foreground location has been granted.")

private val FOREGROUND_PERMISSIONS = arrayOf(
  Manifest.permission.ACCESS_COARSE_LOCATION,
  Manifest.permission.ACCESS_FINE_LOCATION
)
private val LOCATION_PERMISSIONS = arrayOf(
  Manifest.permission.ACCESS_COARSE_LOCATION,
  Manifest.permission.ACCESS_FINE_LOCATION,
  Manifest.permission.ACCESS_BACKGROUND_LOCATION
)
private val COARSE_PERMISSIONS = arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION)

// Before Q there is no separate background permission -- foreground access covers it.
// ChecksSdkIntAtLeast keeps lint's API-level narrowing working through the call.
@ChecksSdkIntAtLeast(api = Build.VERSION_CODES.Q)
private fun supportsBackgroundPermission(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q

internal suspend fun Permissions.requestBackgroundPermissions() {
  if (!supportsBackgroundPermission()) {
    return
  }
  if (!isPermissionPresentInManifest(Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
    throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
  }

  val foregroundPermission = queryPermissions(*FOREGROUND_PERMISSIONS).foregroundPermission()
  if (foregroundPermission.status != PermissionsStatus.GRANTED) {
    throw RequestingBackgroundPermissionsWithoutForegroundGrantException()
  }
  requestPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
}

internal suspend fun Permissions.requestForegroundPermissions(options: RequestForegroundPermissionsOptions?) {
  val permissions = when (options?.accuracy ?: LocationAccuracyOption.FULL) {
    LocationAccuracyOption.FULL -> FOREGROUND_PERMISSIONS
    LocationAccuracyOption.REDUCED -> COARSE_PERMISSIONS
  }
  requestPermissions(*permissions)
}

internal suspend fun Permissions.getLocationPermissions(background: Boolean): LocationPermissionResponse {
  val permissions = if (supportsBackgroundPermission()) LOCATION_PERMISSIONS else FOREGROUND_PERMISSIONS
  val queried = queryPermissions(*permissions)

  val foregroundPermission = queried.foregroundPermission()
  val backgroundPermission = if (supportsBackgroundPermission()) queried.backgroundPermission() else foregroundPermission
  val foregroundGranted = foregroundPermission.status == PermissionsStatus.GRANTED
  val backgroundGranted = backgroundPermission.status == PermissionsStatus.GRANTED
  val wantedPermission = if (background) backgroundPermission else foregroundPermission

  return LocationPermissionResponse(
    status = LocationPermissionStatus.fromString(wantedPermission.status.status),
    granted = foregroundGranted && (!background || backgroundGranted),
    canAskAgain = wantedPermission.canAskAgain,
    scope = when {
      backgroundGranted -> LocationScope.ALWAYS
      foregroundGranted -> LocationScope.WHEN_IN_USE
      else -> LocationScope.NOT_GRANTED
    },
    accuracy = queried.locationAccuracy(),
    expires = "never"
  )
}

internal fun Permissions.ensureForegroundPermissions() {
  val hasFine = hasGrantedPermissions(Manifest.permission.ACCESS_FINE_LOCATION)
  val hasCoarse = hasGrantedPermissions(Manifest.permission.ACCESS_COARSE_LOCATION)
  if (!hasFine && !hasCoarse) {
    throw ForegroundLocationPermissionsNotGrantedException()
  }
}

internal fun Permissions.ensureBackgroundPermissions() {
  ensureForegroundPermissions()
  if (!supportsBackgroundPermission()) {
    return
  }
  if (!hasGrantedPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
    throw BackgroundLocationPermissionsNotGrantedException()
  }
}

private suspend fun Permissions.queryPermissions(vararg permissions: String): Map<String, PermissionsResponse> {
  val result = CompletableDeferred<Map<String, PermissionsResponse>>()
  getPermissions({ result.complete(it) }, *permissions)
  return result.await()
}

private suspend fun Permissions.requestPermissions(vararg permissions: String): Map<String, PermissionsResponse> {
  val result = CompletableDeferred<Map<String, PermissionsResponse>>()
  askForPermissions({ result.complete(it) }, *permissions)
  return result.await()
}

private fun Map<String, PermissionsResponse>.responseFor(permission: String): PermissionsResponse =
  this[permission] ?: PermissionsResponse(PermissionsStatus.UNDETERMINED)

private fun Map<String, PermissionsResponse>.foregroundPermission(): PermissionsResponse {
  val coarse = responseFor(Manifest.permission.ACCESS_COARSE_LOCATION)
  val fine = responseFor(Manifest.permission.ACCESS_FINE_LOCATION)
  val status = when {
    coarse.status == PermissionsStatus.GRANTED || fine.status == PermissionsStatus.GRANTED -> PermissionsStatus.GRANTED
    coarse.status == PermissionsStatus.DENIED || fine.status == PermissionsStatus.DENIED -> PermissionsStatus.DENIED
    else -> PermissionsStatus.UNDETERMINED
  }
  return PermissionsResponse(status, coarse.canAskAgain || fine.canAskAgain)
}

private fun Map<String, PermissionsResponse>.backgroundPermission(): PermissionsResponse =
  responseFor(Manifest.permission.ACCESS_BACKGROUND_LOCATION)

private fun Map<String, PermissionsResponse>.locationAccuracy(): LocationAccuracy = when {
  responseFor(Manifest.permission.ACCESS_FINE_LOCATION).status == PermissionsStatus.GRANTED -> LocationAccuracy.FULL
  responseFor(Manifest.permission.ACCESS_COARSE_LOCATION).status == PermissionsStatus.GRANTED -> LocationAccuracy.REDUCED
  else -> LocationAccuracy.NOT_GRANTED
}
