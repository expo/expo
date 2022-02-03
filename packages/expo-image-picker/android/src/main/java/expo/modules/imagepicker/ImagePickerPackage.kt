package expo.modules.imagepicker

import android.content.Context
import expo.modules.core.BasePackage

class ImagePickerPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ImagePickerModule(context))
}
