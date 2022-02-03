package abi43_0_0.expo.modules.cellular

import android.content.Context
import abi43_0_0.expo.modules.core.BasePackage

class CellularPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(CellularModule(context))
}
