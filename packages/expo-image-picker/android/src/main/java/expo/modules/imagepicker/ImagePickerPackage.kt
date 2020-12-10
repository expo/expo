package expo.modules.imagepicker

import android.content.Context
import org.unimodules.core.BasePackage

class ImagePickerPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ImagePickerModule(context))
}
