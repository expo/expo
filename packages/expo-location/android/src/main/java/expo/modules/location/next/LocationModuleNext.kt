package expo.modules.location.next

import android.content.Context
import android.location.LocationManager
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.GmsLocationProvider
import expo.modules.location.next.locationProviders.LocationProvider
import kotlinx.coroutines.CompletableDeferred

class RequestingBackgroundPermissionsWithoutForegroundGrantException : CodedException("Need to have foreground permissions granted, before asking for background permissions! Call requestForegroundPermissions() first and make sure the foreground location is granted.")

class LocationModuleNext : Module() {
  lateinit var mContext: Context
  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw NoPermissionsModuleException()
  val fusedLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(mContext)
    val gmsLocationProvider = GmsLocationProvider(
      fusedLocationProvider,
      LocationServices.getSettingsClient(mContext)
    ) { GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(mContext) == ConnectionResult.SUCCESS }

    SharedRef(gmsLocationProvider)
  }
  val androidLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    SharedRef(AndroidLocationProvider(mContext))
  }
  lateinit var currentLocationProvider: LocationProvider
  lateinit var locationManager: LocationManager
  @Volatile
  private var locationServicesPrompt: CompletableDeferred<Boolean>? = null

  override fun definition() = ModuleDefinition {
    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      currentLocationProvider = FallbackLocationProvider(
        listOf(fusedLocationProviderInstance.ref, androidLocationProviderInstance.ref)
      )
      locationManager = mContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
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

    Function("getSelectedLocationProviderName") { ->
      currentLocationProvider.name()
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
      return@Coroutine currentLocationProvider.getPosition(providerOptions).getOrNull()
    }

    Function<Boolean>("hasLocationServicesEnabled") { ->
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
        currentLocationProvider.enableLocationServices(appContext.throwingActivity, promptResult).getOrThrow()
        return@Coroutine promptResult.await()
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
