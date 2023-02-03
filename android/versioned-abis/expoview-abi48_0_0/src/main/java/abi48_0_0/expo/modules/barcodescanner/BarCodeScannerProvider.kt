package abi48_0_0.expo.modules.barcodescanner

import android.content.Context
import abi48_0_0.expo.modules.core.interfaces.InternalModule
import abi48_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import abi48_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import abi48_0_0.expo.modules.barcodescanner.scanners.GMVBarCodeScanner
import abi48_0_0.expo.modules.barcodescanner.scanners.ZxingBarCodeScanner

class BarCodeScannerProvider : InternalModule, BarCodeScannerProviderInterface {
  override fun getExportedInterfaces() =
    listOf(BarCodeScannerProviderInterface::class.java)

  override fun createBarCodeDetectorWithContext(context: Context): BarCodeScannerInterface {
    return GMVBarCodeScanner(context).takeIf {
      it.isAvailable
    } ?: ZxingBarCodeScanner(context)
  }
}
