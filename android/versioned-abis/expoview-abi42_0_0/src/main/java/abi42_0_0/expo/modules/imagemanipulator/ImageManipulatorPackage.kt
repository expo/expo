package abi42_0_0.expo.modules.imagemanipulator

import android.content.Context
import abi42_0_0.org.unimodules.core.BasePackage
import abi42_0_0.org.unimodules.core.ExportedModule

class ImageManipulatorPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ImageManipulatorModule(context))
}
