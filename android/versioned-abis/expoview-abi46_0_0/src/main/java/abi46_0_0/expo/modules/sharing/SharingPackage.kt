package abi46_0_0.expo.modules.sharing

import android.content.Context
import abi46_0_0.expo.modules.core.BasePackage

class SharingPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(SharingModule(context))
}
