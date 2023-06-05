package expo.modules.barcodescanner

import android.content.Context
import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.barcodescanner.scanners.MLKitBarCodeScanner

class BarCodeScannerProvider : InternalModule, BarCodeScannerProviderInterface {
  override fun getExportedInterfaces() =
    listOf(BarCodeScannerProviderInterface::class.java)

  override fun createBarCodeDetectorWithContext(context: Context): BarCodeScannerInterface {
    return MLKitBarCodeScanner(context)
  }
}
