package expo.modules.barcodescanner

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import com.google.android.gms.vision.barcode.Barcode
import expo.modules.barcodescanner.utils.BarCodeScannerResultSerializer
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.interfaces.imageloader.ImageLoaderInterface.ResultListener
import expo.modules.interfaces.permissions.Permissions

class BarCodeScannerModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {
  private val barCodeScannerProvider = BarCodeScannerProvider()
  private val permissions: Permissions by moduleRegistry()

  private inline fun <reified T> moduleRegistry() =
    moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName() = TAG

  override fun getConstants() = mapOf(
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

  @ExpoMethod
  fun requestPermissionsAsync(promise: Promise) {
    permissions.askForPermissionsWithPromise(promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun getPermissionsAsync(promise: Promise) {
    permissions.getPermissionsWithPromise(promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun scanFromURLAsync(url: String, barCodeTypes: List<Double>?, promise: Promise) {
    val types = barCodeTypes?.indices?.map {
      barCodeTypes[it].toInt()
    } ?: mutableListOf()

    val imageLoader: ImageLoaderInterface by moduleRegistry()
    imageLoader.loadImageForManipulationFromURL(
      url,
      object : ResultListener {
        override fun onSuccess(bitmap: Bitmap) {
          val scanner = barCodeScannerProvider.createBarCodeDetectorWithContext(context)
          scanner.setSettings(
            BarCodeScannerSettings().apply {
              putTypes(types)
            }
          )
          val resultList = scanner.scanMultiple(bitmap)
            .filter { types.contains(it.type) }
            .map { BarCodeScannerResultSerializer.toBundle(it, 1.0f) }
          promise.resolve(resultList)
        }

        override fun onFailure(cause: Throwable?) {
          promise.reject(
            "${ERROR_TAG}_IMAGE_RETRIEVAL_ERROR",
            "Could not get the image from given url: '$url'",
            cause
          )
        }
      }
    )
  }

  companion object {
    private const val TAG = "ExpoBarCodeScannerModule"
    private const val ERROR_TAG = "E_BARCODE_SCANNER"
  }
}
