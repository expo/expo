package expo.modules.sharing

import android.content.Context
import expo.modules.core.BasePackage

class SharingPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(SharingModule(context))
}
