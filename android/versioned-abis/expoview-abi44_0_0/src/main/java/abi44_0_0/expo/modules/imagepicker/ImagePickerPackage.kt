package abi44_0_0.expo.modules.imagepicker

import android.content.Context
import abi44_0_0.expo.modules.core.BasePackage

class ImagePickerPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ImagePickerModule(context))
}
