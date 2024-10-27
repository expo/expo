package expo.modules.location

import expo.modules.kotlin.exception.CodedException

internal class NoPermissionsModuleException :
  CodedException("Permissions module is null. Are you sure all the installed Expo modules are properly linked?")

internal class NoPermissionInManifestException(permissionName: String) :
  CodedException("You need to add `$permissionName` to the AndroidManifest")

internal class LocationBackgroundUnauthorizedException :
  CodedException("Not authorized to use background location services")

internal class LocationRequestRejectedException(cause: Exception) :
  CodedException("Location request has been rejected: " + cause.message)

internal class CurrentLocationIsUnavailableException :
  CodedException("Current location is unavailable. Make sure that location services are enabled")

internal class LocationRequestCancelledException :
  CodedException("Location request has been cancelled")

internal class LocationSettingsUnsatisfiedException :
  CodedException("Location request failed due to unsatisfied device settings")

internal class LocationUnauthorizedException :
  CodedException("Not authorized to use location services")

internal class LocationUnavailableException :
  CodedException("Location is unavailable. Make sure that location services are enabled")

internal class LocationUnknownException :
  CodedException("Current location is unknown")

internal class SensorManagerUnavailable :
  CodedException("Sensor manager is unavailable")

internal class GeocodeException(message: String?, cause: Throwable? = null) :
  CodedException("An exception occurred when accessing the geocode: ${message ?: ""} ${cause?.message ?: ""}")

internal class NoGeocodeException :
  CodedException("Could not find the Geocoder")

internal class TaskManagerNotFoundException :
  CodedException("Could not find the task manager")

internal class GeofencingException(message: String?, cause: Throwable? = null) :
  CodedException("A geofencing exception has occurred: ${message ?: ""} ${cause?.message ?: ""}")

internal class MissingUIManagerException :
  CodedException("UIManager is unavailable")

internal class ConversionException(fromClass: Class<*>, toClass: Class<*>, message: String? = "") :
  CodedException("Couldn't cast from ${fromClass::class.simpleName} to ${toClass::class.java.simpleName}: $message")

internal class ForegroundServiceStartNotAllowedException :
  CodedException("Couldn't start the foreground service. Foreground service cannot be started when the application is in the background")

internal class ForegroundServicePermissionsException :
  CodedException("Couldn't start the foreground service. Foreground service permissions were not found in the manifest")
