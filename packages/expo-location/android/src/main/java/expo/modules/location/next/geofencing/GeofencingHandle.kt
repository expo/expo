package expo.modules.location.next.geofencing

import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.location.next.locationProviders.LocationProvider
import expo.modules.location.next.locationProviders.ProviderResult

private const val MAX_REQUEST_ID_LENGTH = 100

class GeofencingHandle(
  val taskName: String,
  val locationProvider: LocationProvider
) : SharedObject() {
  fun validate(regions: List<GeofencingRegion>) {
    // CLMonitor on iOS accepts only ASCII letters and digits in a monitor name.
    // Android has no such limit. The check keeps task names valid on both.
    val hasOnlyASCIIAlphanumerics = taskName.all { character ->
      character in 'a'..'z' || character in 'A'..'Z' || character in '0'..'9'
    }
    if (taskName.isEmpty() || !hasOnlyASCIIAlphanumerics) {
      throw GeofencingTaskNameInvalid(taskName)
    }

    val identifiers = mutableSetOf<String>()
    for (region in regions) {
      val requestIdLength = region.requestId(taskName).length
      if (!region.isValid() || requestIdLength > MAX_REQUEST_ID_LENGTH || !identifiers.add(region.identifier)) {
        throw GeofencingRegionInvalid(region.identifier)
      }
    }
  }
}

fun getExistingOrNewGeofencingTaskConsumer(handle: GeofencingHandle, taskManager: TaskManagerInterface): ProviderResult<Class<out TaskConsumer>> {
  val existing = handle.locationProvider.getRegisteredGeofencingTaskConsumerClass(taskManager, handle.taskName)
  if (existing is ProviderResult.Available) {
    return existing
  }
  return handle.locationProvider.getGeofencingTaskConsumerClass()
}
