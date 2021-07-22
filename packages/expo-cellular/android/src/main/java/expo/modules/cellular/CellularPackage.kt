package expo.modules.cellular

import android.content.Context
import org.unimodules.core.BasePackage

class CellularPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(CellularModule(context))
}
