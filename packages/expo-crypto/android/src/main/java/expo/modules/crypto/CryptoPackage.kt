package expo.modules.crypto

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class CryptoPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> = listOf(CryptoModule(context))
}
