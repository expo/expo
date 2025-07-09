package expo.modules.camera.analyzers

import android.os.Bundle
import android.util.Pair
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import expo.modules.camera.utils.BarCodeScannerResult

object BarCodeScannerResultSerializer {
  fun toBundle(result: BarCodeScannerResult, density: Float) =
    Bundle().apply {
      putString("data", result.value)
      putString("raw", result.raw)
      putInt("type", result.type)
      putBundle("extra", result.extra)
      val cornerPointsAndBoundingBox = getCornerPointsAndBoundingBox(result.cornerPoints, result.boundingBox, density)
      putParcelableArrayList("cornerPoints", cornerPointsAndBoundingBox.first)
      putBundle("bounds", cornerPointsAndBoundingBox.second)
    }

  fun parseBarcodeScanningResult(barcode: Barcode, inputImage: InputImage? = null): BarCodeScannerResult {
    val raw = barcode.rawValue ?: barcode.rawBytes?.let { String(it) }
    val value = if (barcode.valueType == Barcode.TYPE_CONTACT_INFO) {
      raw
    } else {
      barcode.displayValue
    }
    val cornerPoints = mutableListOf<Int>()
    barcode.cornerPoints?.let { points ->
      for (point in points) {
        cornerPoints.addAll(listOf(point.x, point.y))
      }
    }

    val extra = parseExtraDate(barcode)
    return BarCodeScannerResult(barcode.format, value, raw, extra, cornerPoints, inputImage?.height ?: 0, inputImage?.width ?: 0)
  }

  private fun getCornerPointsAndBoundingBox(
    cornerPoints: List<Int>,
    boundingBox: BarCodeScannerResult.BoundingBox,
    density: Float
  ): Pair<ArrayList<Bundle>, Bundle> {
    val convertedCornerPoints = ArrayList<Bundle>()
    for (i in cornerPoints.indices step 2) {
      val x = cornerPoints[i].toFloat() / density
      val y = cornerPoints[i + 1].toFloat() / density

      convertedCornerPoints.add(getPoint(x, y))
    }
    val boundingBoxBundle = Bundle().apply {
      putParcelable("origin", getPoint(boundingBox.x.toFloat() / density, boundingBox.y.toFloat() / density))
      putParcelable("size", getSize(boundingBox.width.toFloat() / density, boundingBox.height.toFloat() / density))
    }
    return Pair(convertedCornerPoints, boundingBoxBundle)
  }

  fun parseExtraDate(barcode: Barcode): Bundle {
    val result = Bundle()

    when (barcode.valueType) {
      Barcode.TYPE_CONTACT_INFO -> {
        val info = barcode.contactInfo
        result.apply {
          putString("type", "contactInfo")
          putString("firstName", info?.name?.first)
          putString("middleName", info?.name?.middle)
          putString("lastName", info?.name?.last)
          putString("title", info?.title)
          putString("organization", info?.organization)
          putString("email", info?.emails?.firstOrNull()?.address)
          putString("phone", info?.phones?.firstOrNull()?.number)
          putString("url", info?.urls?.firstOrNull())
          putString("address", info?.addresses?.firstOrNull()?.addressLines?.firstOrNull())
        }
      }

      Barcode.TYPE_GEO -> {
        val geo = barcode.geoPoint
        result.apply {
          putString("type", "geoPoint")
          putString("lat", geo?.lat.toString())
          putString("lng", geo?.lng.toString())
        }
      }

      Barcode.TYPE_SMS -> {
        val sms = barcode.sms
        result.apply {
          putString("type", "sms")
          putString("phoneNumber", sms?.phoneNumber)
          putString("message", sms?.message)
        }
      }

      Barcode.TYPE_URL -> {
        val url = barcode.url
        result.putString("type", "url")
        result.putString("url", url?.url)
      }

      Barcode.TYPE_CALENDAR_EVENT -> {
        val event = barcode.calendarEvent
        result.apply {
          result.putString("type", "calendarEvent")
          putString("summary", event?.summary)
          putString("description", event?.description)
          putString("location", event?.location)
          putString("start", event?.start?.toString())
          putString("end", event?.end?.toString())
        }
      }

      Barcode.TYPE_DRIVER_LICENSE -> {
        val license = barcode.driverLicense
        result.apply {
          result.putString("type", "driverLicense")
          putString("firstName", license?.firstName)
          putString("middleName", license?.middleName)
          putString("lastName", license?.lastName)
          putString("licenseNumber", license?.licenseNumber)
          putString("expiryDate", license?.expiryDate)
          putString("issueDate", license?.issueDate)
          putString("addressStreet", license?.addressStreet)
          putString("addressCity", license?.addressCity)
          putString("addressState", license?.addressState)
        }
      }

      Barcode.TYPE_EMAIL -> {
        val email = barcode.email
        result.apply {
          result.putString("type", "email")
          putString("address", email?.address)
          putString("subject", email?.subject)
          putString("body", email?.body)
        }
      }

      Barcode.TYPE_PHONE -> {
        val phone = barcode.phone
        result.apply {
          result.putString("type", "phone")
          putString("number", phone?.number)
          putString("phoneNumberType", phone?.type.toString())
        }
      }

      Barcode.TYPE_WIFI -> {
        val wifi = barcode.wifi
        result.apply {
          result.putString("type", "wifi")
          putString("ssid", wifi?.ssid)
          putString("password", wifi?.password)
          putString("type", wifi?.encryptionType.toString())
        }
      }
    }

    return result
  }

  private fun getSize(width: Float, height: Float) =
    Bundle().apply {
      putFloat("width", width)
      putFloat("height", height)
    }

  private fun getPoint(x: Float, y: Float) =
    Bundle().apply {
      putFloat("x", x)
      putFloat("y", y)
    }
}
