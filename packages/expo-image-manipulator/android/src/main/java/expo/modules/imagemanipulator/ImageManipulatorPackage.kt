package expo.modules.imagemanipulator

import android.content.Context
import expo.modules.core.BasePackage

class ImageManipulatorPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ImageManipulatorModule(context))
}
