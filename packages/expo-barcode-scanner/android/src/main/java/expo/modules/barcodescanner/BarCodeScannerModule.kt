package expo.modules.barcodescanner

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import com.google.android.gms.vision.barcode.Barcode
import expo.modules.barcodescanner.utils.BarCodeScannerResultSerializer
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.imageloader.ImageLoaderInterface.ResultListener
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BarCodeScannerModule : Module() {
  private val barCodeScannerProvider = BarCodeScannerProvider()
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()

  override fun definition() = ModuleDefinition {
    Name("ExpoBarCodeScanner")

    Constants(
      "BarCodeType" to mapOf(
        "aztec" to Barcode.AZTEC,
        "ean13" to Barcode.EAN_13,
        "ean8" to Barcode.EAN_8,
        "qr" to Barcode.QR_CODE,
        "pdf417" to Barcode.PDF417,
        "upc_e" to Barcode.UPC_E,
        "datamatrix" to Barcode.DATA_MATRIX,
        "code39" to Barcode.CODE_39,
        "code93" to Barcode.CODE_93,
        "itf14" to Barcode.ITF,
        "codabar" to Barcode.CODABAR,
        "code128" to Barcode.CODE_128,
        "upc_a" to Barcode.UPC_A,
      ),
      "Type" to mapOf(
        "front" to ExpoBarCodeScanner.CAMERA_TYPE_FRONT,
        "back" to ExpoBarCodeScanner.CAMERA_TYPE_BACK
      )
    )

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.CAMERA
      )
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.CAMERA
      )
    }

    AsyncFunction("scanFromURLAsync") { url: String, barCodeTypes: List<Int>, promise: Promise ->
      appContext.imageLoader?.loadImageForManipulationFromURL(
        url,
        object : ResultListener {
          override fun onSuccess(bitmap: Bitmap) {
            val scanner = barCodeScannerProvider.createBarCodeDetectorWithContext(context)
            scanner.setSettings(
              BarCodeScannerSettings().apply {
                putTypes(barCodeTypes)
              }
            )
            val resultList = scanner.scanMultiple(bitmap)
              .filter { barCodeTypes.contains(it.type) }
              .map { BarCodeScannerResultSerializer.toBundle(it, 1.0f) }
            promise.resolve(resultList)
          }

          override fun onFailure(cause: Throwable?) {
            promise.reject(ImageRetrievalException(url))
          }
        }
      )
    }

    View(BarCodeScannerView::class) {
      Events("onBarCodeScanned")

      Prop("type") { view: BarCodeScannerView, type: Int ->
        view.setCameraType(type)
      }

      Prop("barCodeTypes") { view: BarCodeScannerView, barCodeTypes: ArrayList<Double?>? ->
        if (barCodeTypes != null) {
          val settings = BarCodeScannerSettings().apply {
            putTypes(barCodeTypes)
          }
          view.setBarCodeScannerSettings(settings)
        }
      }
    }
  }
}
