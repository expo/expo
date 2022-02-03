package abi42_0_0.expo.modules.documentpicker

import android.content.Context
import abi42_0_0.org.unimodules.core.BasePackage

class DocumentPickerPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(DocumentPickerModule(context))
}
