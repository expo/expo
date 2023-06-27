package abi49_0_0.expo.modules.barcodescanner

import android.content.Context
import abi49_0_0.expo.modules.core.interfaces.InternalModule
import abi49_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerProviderInterface
import abi49_0_0.expo.modules.interfaces.barcodescanner.BarCodeScannerInterface
import abi49_0_0.expo.modules.barcodescanner.scanners.MLKitBarCodeScanner

class BarCodeScannerProvider : InternalModule, BarCodeScannerProviderInterface {
  override fun getExportedInterfaces() =
    listOf(BarCodeScannerProviderInterface::class.java)

  override fun createBarCodeDetectorWithContext(context: Context): BarCodeScannerInterface {
    return MLKitBarCodeScanner(context)
  }
}
