package expo.modules.location.next.geocoding

import android.content.Context
import android.location.Address as AndroidAddress
import android.location.Geocoder
import android.os.Build
import androidx.annotation.DeprecatedSinceApi
import androidx.annotation.RequiresApi
import expo.modules.core.logging.Logger
import expo.modules.location.next.Coordinates
import java.io.IOException
import java.util.Locale
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext

private const val MAX_GEOCODING_RESULTS = 4

sealed interface GeocodingQuery {
  data class ByAddress(val address: String) : GeocodingQuery
  data class ByCoordinates(val coordinates: Coordinates) : GeocodingQuery
}

private suspend fun Geocoder.findAddresses(query: GeocodingQuery): List<AndroidAddress> {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    return findAddressesModern(query)
  }
  return findAddressesLegacy(query)
}

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private suspend fun Geocoder.findAddressesModern(query: GeocodingQuery): List<AndroidAddress> =
  suspendCancellableCoroutine { continuation ->
    val listener = object : Geocoder.GeocodeListener {
      override fun onGeocode(addresses: MutableList<AndroidAddress>) {
        continuation.resume(addresses)
      }

      override fun onError(errorMessage: String?) {
        continuation.resumeWithException(IOException(errorMessage))
      }
    }
    when (query) {
      is GeocodingQuery.ByAddress ->
        getFromLocationName(query.address, MAX_GEOCODING_RESULTS, listener)
      is GeocodingQuery.ByCoordinates ->
        getFromLocation(query.coordinates.latitude, query.coordinates.longitude, MAX_GEOCODING_RESULTS, listener)
    }
  }

@DeprecatedSinceApi(Build.VERSION_CODES.TIRAMISU)
private suspend fun Geocoder.findAddressesLegacy(query: GeocodingQuery): List<AndroidAddress> =
  withContext(Dispatchers.IO) {
    when (query) {
      is GeocodingQuery.ByAddress ->
        getFromLocationName(query.address, MAX_GEOCODING_RESULTS)
      is GeocodingQuery.ByCoordinates ->
        getFromLocation(query.coordinates.latitude, query.coordinates.longitude, MAX_GEOCODING_RESULTS)
    }.orEmpty()
  }

private fun AndroidAddress.toAddress(): Address? {
  if (!hasLatitude() || !hasLongitude()) {
    return null
  }
  return Address(
    coordinates = Coordinates(latitude, longitude),
    name = featureName?.takeIf { it.isNotBlank() },
    formattedAddress = formattedAddressOrNull(),
    city = locality?.takeIf { it.isNotBlank() },
    country = countryName?.takeIf { it.isNotBlank() },
    isoCountryCode = countryCode?.takeIf { it.isNotBlank() }
  )
}

private fun AndroidAddress.formattedAddressOrNull(): String? {
  return (0..maxAddressLineIndex)
    .mapNotNull { getAddressLine(it) }
    .filter { it.isNotBlank() }
    .joinToString(", ")
    .takeIf { it.isNotBlank() }
}

private fun resolveLocale(locale: String?, logger: Logger?): Locale {
  val requestedLocale = locale ?: return Locale.getDefault()
  val parsedLocale = Locale.forLanguageTag(requestedLocale)
  if (parsedLocale.language.isEmpty()) {
    logger?.warn("[expo-location] Unrecognized locale '$requestedLocale', the device locale will be used instead.")
    return Locale.getDefault()
  }
  return parsedLocale
}

suspend fun geocode(
  context: Context,
  logger: Logger?,
  query: GeocodingQuery,
  locale: String?
): List<Address> {
  if (!Geocoder.isPresent()) {
    throw NoGeocodingBackendException()
  }
  val resolvedLocale = resolveLocale(locale, logger)
  val results = try {
    Geocoder(context, resolvedLocale).findAddresses(query)
  } catch (exception: CancellationException) {
    throw exception
  } catch (exception: IOException) {
    throw GeocodingUnavailableException(exception)
  } catch (exception: RuntimeException) {
    throw GeocodingFailedException(exception)
  }
  return results.mapNotNull { it.toAddress() }
}
