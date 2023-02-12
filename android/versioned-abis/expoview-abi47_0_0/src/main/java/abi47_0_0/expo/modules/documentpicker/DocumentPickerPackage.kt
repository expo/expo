package abi47_0_0.expo.modules.documentpicker

import android.content.Context
import abi47_0_0.expo.modules.core.BasePackage

class DocumentPickerPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(DocumentPickerModule(context))
}
