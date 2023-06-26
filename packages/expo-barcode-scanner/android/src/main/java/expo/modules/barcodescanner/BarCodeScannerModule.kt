package expo.modules.barcodescanner

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.google.mlkit.vision.barcode.common.Barcode
import expo.modules.barcodescanner.utils.BarCodeScannerResultSerializer
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.imageloader.ImageLoaderInterface.ResultListener
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class BarCodeScannerModule : Module() {
  private val barCodeScannerProvider = BarCodeScannerProvider()
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)

  override fun definition() = ModuleDefinition {
    Name("ExpoBarCodeScanner")

    Constants(
      "BarCodeType" to mapOf(
        "aztec" to Barcode.FORMAT_AZTEC,
        "ean13" to Barcode.FORMAT_EAN_13,
        "ean8" to Barcode.FORMAT_EAN_8,
        "qr" to Barcode.FORMAT_QR_CODE,
        "pdf417" to Barcode.FORMAT_PDF417,
        "upc_e" to Barcode.FORMAT_UPC_E,
        "datamatrix" to Barcode.FORMAT_DATA_MATRIX,
        "code39" to Barcode.FORMAT_CODE_39,
        "code93" to Barcode.FORMAT_CODE_93,
        "itf14" to Barcode.FORMAT_ITF,
        "codabar" to Barcode.FORMAT_CODABAR,
        "code128" to Barcode.FORMAT_CODE_128,
        "upc_a" to Barcode.FORMAT_UPC_A,
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

            moduleCoroutineScope.launch {
              val barcodes = scanner.scanMultiple(bitmap)
                .filter { barCodeTypes.contains(it.type) }
                .map { BarCodeScannerResultSerializer.toBundle(it, 1.0f) }
              promise.resolve(barcodes)
            }
          }

          override fun onFailure(cause: Throwable?) {
            promise.reject(ImageRetrievalException(url))
          }
        }
      )
    }

    OnDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
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

  companion object {
    internal val TAG = BarCodeScannerModule::class.java.simpleName
  }
}
