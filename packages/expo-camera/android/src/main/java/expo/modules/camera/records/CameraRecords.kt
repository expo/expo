package expo.modules.camera.records

import android.hardware.camera2.CameraMetadata
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.video.Quality
import com.google.mlkit.vision.barcode.common.Barcode
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

enum class CameraType(val value: String) : Enumerable {
  FRONT("front"),
  BACK("back");

  fun mapToSelector() = when (this) {
    FRONT -> CameraSelector.DEFAULT_FRONT_CAMERA
    BACK -> CameraSelector.DEFAULT_BACK_CAMERA
  }

  fun mapToCharacteristic() = when (this) {
    FRONT -> CameraMetadata.LENS_FACING_FRONT
    BACK -> CameraMetadata.LENS_FACING_BACK
  }
}

enum class VideoQuality(val value: String) : Enumerable {
  VIDEO2160P("2160p"),
  VIDEO1080P("1080p"),
  VIDEO720P("720p"),
  VIDEO480P("480p"),
  VIDEO4X3("4:3");

  fun mapToQuality(): Quality = when (this) {
    VIDEO2160P -> Quality.UHD
    VIDEO1080P -> Quality.FHD
    VIDEO720P -> Quality.HD
    VIDEO480P -> Quality.SD
    VIDEO4X3 -> Quality.LOWEST
  }
}

enum class FlashMode(val value: String) : Enumerable {
  AUTO("auto"),
  ON("on"),
  OFF("off");

  fun mapToLens() = when (this) {
    AUTO -> ImageCapture.FLASH_MODE_AUTO
    OFF -> ImageCapture.FLASH_MODE_OFF
    ON -> ImageCapture.FLASH_MODE_ON
  }
}

enum class CameraMode(val value: String) : Enumerable {
  PICTURE("picture"),
  VIDEO("video")
}

enum class FocusMode(val value: String) : Enumerable {
  ON("on"),
  OFF("off")
}

data class BarcodeSettings(
  @Field val barcodeTypes: List<BarcodeType>
) : Record

enum class BarcodeType(val value: String) : Enumerable {
  AZTEC("aztec"),
  EAN13("ean13"),
  EAN8("ean8"),
  QR("qr"),
  PDF417("pdf417"),
  UPCE("upc_e"),
  DATAMATRIX("datamatrix"),
  CODE39("code39"),
  CODE93("code93"),
  ITF14("itf14"),
  CODABAR("codabar"),
  CODE128("code128"),
  UPCA("upc_a");

  fun mapToBarcode() = when (this) {
    AZTEC -> Barcode.FORMAT_AZTEC
    EAN13 -> Barcode.FORMAT_EAN_13
    EAN8 -> Barcode.FORMAT_EAN_8
    QR -> Barcode.FORMAT_QR_CODE
    PDF417 -> Barcode.FORMAT_PDF417
    UPCE -> Barcode.FORMAT_UPC_E
    DATAMATRIX -> Barcode.FORMAT_DATA_MATRIX
    CODE39 -> Barcode.FORMAT_CODE_39
    CODE93 -> Barcode.FORMAT_CODE_93
    ITF14 -> Barcode.FORMAT_ITF
    CODABAR -> Barcode.FORMAT_CODABAR
    CODE128 -> Barcode.FORMAT_CODE_128
    UPCA -> Barcode.FORMAT_UPC_A
  }
}
