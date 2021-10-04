package abi43_0_0.expo.modules.crypto

import android.content.Context
import abi43_0_0.expo.modules.core.BasePackage
import abi43_0_0.expo.modules.core.ExportedModule

class CryptoPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> = listOf(CryptoModule(context))
}
