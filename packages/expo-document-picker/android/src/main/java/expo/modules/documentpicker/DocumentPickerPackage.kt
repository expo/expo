package expo.modules.documentpicker

import android.content.Context
import expo.modules.core.BasePackage

class DocumentPickerPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(DocumentPickerModule(context))
}
