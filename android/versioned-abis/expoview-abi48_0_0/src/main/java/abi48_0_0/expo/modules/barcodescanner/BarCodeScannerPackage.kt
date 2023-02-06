package abi48_0_0.expo.modules.barcodescanner

import android.content.Context
import abi48_0_0.expo.modules.core.BasePackage
import abi48_0_0.expo.modules.core.interfaces.InternalModule

class BarCodeScannerPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> {
    return listOf(BarCodeScannerProvider())
  }
}
