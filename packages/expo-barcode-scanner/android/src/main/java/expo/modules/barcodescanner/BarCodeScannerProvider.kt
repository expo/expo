package expo.modules.barcodescanner

import android.content.Context
import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import expo.modules.barcodescanner.scanners.GMVBarCodeScanner
import expo.modules.barcodescanner.scanners.ZxingBarCodeScanner

class BarCodeScannerProvider : InternalModule, BarCodeScannerProviderInterface {
  override fun getExportedInterfaces() =
    listOf(BarCodeScannerProviderInterface::class.java)

  override fun createBarCodeDetectorWithContext(context: Context): BarCodeScannerInterface {
    return GMVBarCodeScanner(context).takeIf {
      it.isAvailable
    } ?: ZxingBarCodeScanner(context)
  }
}
