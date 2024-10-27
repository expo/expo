package expo.modules.location.records

import android.location.Address
import android.location.Location
import android.os.BaseBundle
import android.os.Build
import android.os.Bundle
import android.os.PersistableBundle
import android.util.Log
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.location.ConversionException
import expo.modules.location.LocationModule
import java.io.Serializable

internal class PermissionRequestResponse(
  @Field var canAskAgain: Boolean?,
  @Field var expires: String?,
  @Field var granted: Boolean,
  @Field var status: String?,
  @Field var android: PermissionDetailsLocationAndroid?
) : Record, Serializable {
  constructor(bundle: Bundle) : this(
    canAskAgain = bundle.getBoolean("canAskAgain"),
    expires = bundle.getString("expires")
      ?: throw ConversionException(Bundle::class.java, PermissionRequestResponse::class.java, "value under `expires` key is undefined"),
    granted = bundle.getBoolean("granted"),
    status = bundle.getString("status")
      ?: throw ConversionException(Bundle::class.java, PermissionRequestResponse::class.java, "value under `status` key is undefined"),
    android = bundle.getBundle("android")?.let { PermissionDetailsLocationAndroid(it) }
  )
}

internal class PermissionDetailsLocationAndroid(
  @Field var accuracy: String
) : Record, Serializable {
  constructor(bundle: Bundle) : this(
    accuracy = (bundle.getString("accuracy") ?: "none")
  )
}

internal class LocationProviderStatus(
  @Field var backgroundModeEnabled: Boolean? = null,
  @Field var gpsAvailable: Boolean? = false,
  @Field var networkAvailable: Boolean? = null,
  @Field var locationServicesEnabled: Boolean = false,
  @Field var passiveAvailable: Boolean? = null
) : Record, Serializable

internal class Heading(
  @Field var trueHeading: Float = -1f,
  @Field var magHeading: Float = -1f,
  @Field var accuracy: Int = 0
) {
  internal fun toBundle(): Bundle {
    return Bundle().apply {
      putFloat("trueHeading", trueHeading)
      putFloat("magHeading", magHeading)
      putInt("accuracy", accuracy)
    }
  }
}

internal class HeadingEventResponse(
  @Field var watchId: Int? = null,
  @Field var heading: Heading? = null
) : Record, Serializable {
  internal fun toBundle(): Bundle {
    return Bundle().apply {
      watchId?.let { putInt("watchId", it) }
      heading?.let { putBundle("heading", it.toBundle()) }
    }
  }
}

internal class LocationResponse(
  @Field var coords: LocationObjectCoords? = null,
  @Field var timestamp: Double? = null,
  @Field var mocked: Boolean? = null
) : Record, Serializable {
  constructor(location: Location) : this(
    coords = LocationObjectCoords(location),
    timestamp = location.time.toDouble(),
    mocked = location.isFromMockProvider
  )

  internal fun <BundleType : BaseBundle> toBundle(bundleTypeClass: Class<BundleType>): BundleType {
    val bundle: BundleType = when (bundleTypeClass) {
      PersistableBundle::class.java -> PersistableBundle()
      else -> Bundle()
    } as? BundleType
      ?: throw ConversionException(LocationResponse::class.java, bundleTypeClass, "Unsupported bundleTypeClass")

    return bundle.apply {
      timestamp?.let { putDouble("timestamp", it) }
      mocked?.let { putBoolean("mocked", it) }
      if (bundle is PersistableBundle) {
        (this as PersistableBundle).putPersistableBundle("coords", coords?.toBundle(PersistableBundle::class.java))
      } else if (bundle is Bundle) {
        (this as Bundle).putBundle("coords", coords?.toBundle(Bundle::class.java))
      }
    }
  }
}

internal class LocationObjectCoords(
  @Field var latitude: Double? = null,
  @Field var longitude: Double? = null,
  @Field var altitude: Double? = null,
  @Field var accuracy: Double? = null,
  @Field var altitudeAccuracy: Double? = null,
  @Field var heading: Double? = null,
  @Field var speed: Double? = null
) : Record, Serializable {
  constructor(location: Location) : this(
    latitude = location.latitude,
    longitude = location.longitude,
    altitude = location.altitude,
    accuracy = location.accuracy.toDouble(),
    altitudeAccuracy = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      location.verticalAccuracyMeters.toDouble()
    } else {
      null
    },
    heading = location.bearing.toDouble(),
    speed = location.speed.toDouble()
  )

  internal fun <BundleType : BaseBundle> toBundle(bundleTypeClass: Class<BundleType>): BundleType {
    val bundle: BundleType = when (bundleTypeClass) {
      PersistableBundle::class.java -> PersistableBundle()
      else -> Bundle()
    } as? BundleType
      ?: throw ConversionException(LocationObjectCoords::class.java, bundleTypeClass, "Requested an unsupported bundle type")

    bundle.apply {
      latitude?.let { putDouble("latitude", it) }
      longitude?.let { putDouble("longitude", it) }
      altitude?.let { putDouble("altitude", it) }
      accuracy?.let { putDouble("accuracy", it) }
      altitudeAccuracy?.let { putDouble("altitudeAccuracy", it) }
      heading?.let { putDouble("heading", it) }
      speed?.let { putDouble("speed", it) }
    }
    return bundle
  }
}

internal class GeocodeResponse(
  @Field var latitude: Double,
  @Field var longitude: Double,
  @Field var accuracy: Float? = null,
  @Field var altitude: Double? = null
) : Record, Serializable {
  companion object {
    fun from(location: Location): GeocodeResponse? {
      return try {
        GeocodeResponse(
          latitude = location.latitude,
          longitude = location.longitude,
          accuracy = location.accuracy,
          altitude = location.altitude
        )
      } catch (e: Exception) {
        if (e is IllegalAccessException || e is InstantiationException) {
          Log.e(LocationModule.TAG, "Unexpected exception was thrown when converting location to coords bundle: ", e)
        }
        null
      }
    }
  }
}

internal class ReverseGeocodeResponse(
  @Field var city: String?,
  @Field var district: String?,
  @Field var streetNumber: String?,
  @Field var street: String?,
  @Field var region: String?,
  @Field var subregion: String?,
  @Field var country: String?,
  @Field var postalCode: String?,
  @Field var name: String?,
  @Field var isoCountryCode: String,
  @Field var timezone: String?,
  @Field var formattedAddress: String?
) : Record, Serializable {
  constructor(address: Address) : this(
    city = address.locality,
    district = address.subLocality,
    streetNumber = address.subThoroughfare,
    street = address.thoroughfare,
    region = address.adminArea,
    subregion = address.subAdminArea,
    country = address.countryName,
    postalCode = address.postalCode,
    name = address.featureName,
    isoCountryCode = address.countryCode,
    timezone = null,
    formattedAddress = constructFormattedAddress(address)
  )

  companion object {
    fun constructFormattedAddress(address: Address): String? {
      if (address.maxAddressLineIndex == -1) {
        return null
      }
      val sb = StringBuilder()
      for (i in 0..address.maxAddressLineIndex) {
        sb.append(address.getAddressLine(i))
        if (i < address.maxAddressLineIndex) {
          sb.append(", ")
        }
      }
      return sb.toString()
    }
  }
}
