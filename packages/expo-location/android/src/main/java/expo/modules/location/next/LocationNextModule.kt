package expo.modules.location.next

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume


private const val TAG = "LocationNextModule"

// A cold GPS fix (the most reliable provider on devices without Google services) can take a while.
private const val CURRENT_LOCATION_TIMEOUT_MS = 90_000L

// A cached fix newer than this is treated as "current enough" and returned immediately.
private const val MAX_CACHED_LOCATION_AGE_MS = 2 * 60 * 1000L

@OptimizedRecord
internal class CurrentLocationResult(
    @Field var latitude: Double,
    @Field var longitude: Double,
) : Record

class LocationClass {
    // Store location / placeName and compute the 2nd one lazily
    // Maybe as an enum class to ensure that at least one exists with type system
    var location: Location
    var placeName: String,

    // add math utils for Location
    companion object {
        fun calculateDistance(LocationClass l0, LocationClass l1): Double {
            l0.location.distanceTo(l1)
        }
    }
}

internal enum class LocationProvider: Enumerable{
    FUSED,
    NETWORK,
    GPS,
    PASSIVE;

    fun toSystemProvider(): String = when (this) {
        FUSED -> LocationManager.FUSED_PROVIDER
        NETWORK -> LocationManager.NETWORK_PROVIDER
        GPS -> LocationManager.GPS_PROVIDER
        PASSIVE -> LocationManager.PASSIVE_PROVIDER
    }
}

class LocationNextModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private val locationManager: LocationManager
        get() = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    override fun definition() = ModuleDefinition {
        AsyncFunction("TestFunction") Coroutine { ->
            return@Coroutine "SomeString"
        }

        AsyncFunction("GetCurrentLocation") Coroutine { locationProvider: LocationProvider ->
            ensureLocationPermission()

            val location = requestCurrentLocation(locationProvider)
                ?: throw LocationUnavailableException()

            return@Coroutine CurrentLocationResult(
                latitude = location.latitude,
                longitude = location.longitude
            )
        }
    }

    private fun ensureLocationPermission() {
        val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
        if (fine != PackageManager.PERMISSION_GRANTED && coarse != PackageManager.PERMISSION_GRANTED) {
            throw LocationPermissionException()
        }
    }

    // private fun resolveProvider(): String {
    //     val priority = buildList {
    //         // Framework fused provider (API 31+) is part of AOSP, not Google services, so it works on
    //         // devices without GMS. GPS is the reliable fallback; NETWORK often does nothing without GMS.
    //         // if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    //         //     add(LocationManager.FUSED_PROVIDER)
    //         // }
    //         add(LocationManager.NETWORK_PROVIDER)
    //         add(LocationManager.GPS_PROVIDER)
    //         add(LocationManager.PASSIVE_PROVIDER)
    //     }
    //     return priority.firstOrNull {
    //         it in locationManager.allProviders && locationManager.isProviderEnabled(it)
    //     } ?: throw LocationUnavailableException()
    // }

    private suspend fun requestCurrentLocation(providerOption: LocationProvider): Location? {
        // Fast path: return a recent cached fix immediately. A daily-driver phone almost always has one,
        // and this avoids waiting on a slow cold GPS fix.
        recentCachedLocation()?.let {
            Log.d(TAG, "Using recent cached location from provider: ${it.provider}")
            return it
        }

        // val provider = resolveProvider()
        val provider = providerOption.toSystemProvider()
        Log.d(TAG, "No recent cached fix; requesting fresh location from provider: $provider")

        // Bound the wait so the promise always settles, even if the provider never returns a fix.
        val location = withTimeoutOrNull(CURRENT_LOCATION_TIMEOUT_MS) {
            awaitCurrentLocation(provider)
        }
        if (location != null) {
            return location
        }

        // Fresh fix timed out (e.g. GPS indoors) - fall back to any cached fix, even an older one.
        Log.d(TAG, "No fresh fix within ${CURRENT_LOCATION_TIMEOUT_MS}ms; falling back to last known location")
        return lastKnownLocation()
    }

    @SuppressLint("MissingPermission") // permission is verified in ensureLocationPermission()
    private suspend fun awaitCurrentLocation(provider: String): Location? =
        suspendCancellableCoroutine { continuation ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val signal = CancellationSignal()
                continuation.invokeOnCancellation { signal.cancel() }
                locationManager.getCurrentLocation(
                    provider,
                    signal,
                    ContextCompat.getMainExecutor(context)
                ) { location -> continuation.resume(location) }
            } else {
                // getCurrentLocation() is API 30+; fall back to a single update on older devices.
                val listener = object : LocationListener {
                    override fun onLocationChanged(location: Location) {
                        locationManager.removeUpdates(this)
                        continuation.resume(location)
                    }

                    override fun onProviderEnabled(provider: String) {}

                    override fun onProviderDisabled(provider: String) {}

                    @Deprecated("Deprecated in the framework, still abstract below API 30")
                    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                }
                locationManager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
                continuation.invokeOnCancellation { locationManager.removeUpdates(listener) }
            }
        }

    @SuppressLint("MissingPermission") // permission is verified in ensureLocationPermission()
    private fun lastKnownLocation(): Location? =
        locationManager.allProviders
            .mapNotNull { runCatching { locationManager.getLastKnownLocation(it) }.getOrNull() }
            .maxByOrNull { it.time }

    private fun recentCachedLocation(): Location? {
        val now = System.currentTimeMillis()
        return lastKnownLocation()?.takeIf { now - it.time <= MAX_CACHED_LOCATION_AGE_MS }
    }
}

private class LocationPermissionException :
    CodedException("Location permission is required. Request ACCESS_FINE_LOCATION or ACCESS_COARSE_LOCATION before calling GetCurrentLocation.")

private class LocationUnavailableException :
    CodedException("Current location is unavailable. Make sure location services are enabled and a location provider is available.")
