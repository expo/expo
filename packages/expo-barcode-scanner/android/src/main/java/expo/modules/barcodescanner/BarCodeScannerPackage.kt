package expo.modules.barcodescanner

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.InternalModule

class BarCodeScannerPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> {
    return listOf(BarCodeScannerProvider())
  }
}
