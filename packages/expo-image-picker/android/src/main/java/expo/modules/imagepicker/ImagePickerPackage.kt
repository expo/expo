package expo.modules.imagepicker

import android.content.Context
import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule

class ImagePickerPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> = listOf(ImagePickerModule(context))
}
