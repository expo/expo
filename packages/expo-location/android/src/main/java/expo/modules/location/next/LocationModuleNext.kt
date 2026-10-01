package expo.modules.location.next

import android.content.Context
import android.location.LocationManager
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.EnableLocationServicesResult
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.next.locationProviders.LocationProvider
import kotlinx.coroutines.CompletableDeferred

class LocationModuleNext : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw NoPermissionsModuleException()

  val fusedLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(context)

    val gmsLocationProvider = GmsLocationProvider(
      fusedLocationProvider,
      LocationServices.getSettingsClient(context)
    ) { GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS }

    SharedRef(gmsLocationProvider)
  }

  val androidLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    SharedRef(AndroidLocationProvider(context))
  }

  lateinit var currentLocationProvider: LocationProvider

  lateinit var locationManager: LocationManager

  @Volatile
  private var locationServicesPrompt: CompletableDeferred<Boolean>? = null

  override fun definition() = ModuleDefinition {
    Name("LocationModuleNext")

    OnCreate {
      currentLocationProvider = FallbackLocationProvider(
        listOf(fusedLocationProviderInstance.ref, androidLocationProviderInstance.ref)
      )
      locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    }

    // Permissions
    AsyncFunction("requestForegroundPermissions") Coroutine { options: RequestForegroundPermissionsOptions? ->
      permissionsManager.requestForegroundPermissions(options)
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("getForegroundPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("requestBackgroundPermissions") Coroutine { ->
      permissionsManager.requestBackgroundPermissions()
      return@Coroutine permissionsManager.getLocationPermissions(background = true)
    }

    AsyncFunction("getBackgroundPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getLocationPermissions(background = true)
    }

    // Location providers
    Function("setLocationProvider") { locationProvider: SharedRef<LocationProvider> ->
      currentLocationProvider = locationProvider.ref
    }

    Function("getSelectedLocationProviderName") {
      currentLocationProvider.name
    }

    Class("LocationProvider") {
      StaticFunction("Gms") { ->
        fusedLocationProviderInstance
      }
      StaticFunction("Android") { ->
        androidLocationProviderInstance
      }
      StaticFunction("Fallback") { providers: List<SharedRef<LocationProvider>> ->
        SharedRef(FallbackLocationProvider(providers.map { it.ref }))
      }
    }

    AsyncFunction("getPosition") Coroutine { options: GetPositionOptions? ->
      permissionsManager.ensureForegroundPermissions()
      val providerOptions = (options ?: GetPositionOptions()).toProviderOptions()
      return@Coroutine currentLocationProvider.getPosition(providerOptions).getOrNull("getPosition")
    }

    Function("hasLocationServicesEnabled") { ->
      hasLocationServicesEnabled()
    }

    AsyncFunction("enableLocationServices") Coroutine { ->
      if (hasLocationServicesEnabled()) {
        return@Coroutine true
      }
      locationServicesPrompt?.let {
        return@Coroutine it.await()
      }

      val promptResult = CompletableDeferred<Boolean>()
      locationServicesPrompt = promptResult
      try {
        val enableServicesResult = currentLocationProvider
          .enableLocationServices(appContext.throwingActivity)
          .getOrThrow("enableLocationServices")

        when (enableServicesResult) {
          is EnableLocationServicesResult.Disabled -> promptResult.complete(false)
          is EnableLocationServicesResult.Enabled -> promptResult.complete(true)
          is EnableLocationServicesResult.ResolutionPending -> {}
        }

        return@Coroutine promptResult.await()
      } catch (cause: Throwable) {
        promptResult.completeExceptionally(cause)
        throw cause
      } finally {
        locationServicesPrompt = null
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == SETTINGS_REQUEST_CODE) {
        locationServicesPrompt?.complete(hasLocationServicesEnabled())
      }
    }
  }

  private fun hasLocationServicesEnabled(): Boolean {
    return LocationManagerCompat.isLocationEnabled(locationManager)
  }
}
