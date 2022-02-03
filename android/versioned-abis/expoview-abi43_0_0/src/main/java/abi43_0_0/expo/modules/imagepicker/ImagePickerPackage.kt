package abi43_0_0.expo.modules.imagepicker

import android.content.Context
import abi43_0_0.expo.modules.core.BasePackage

class ImagePickerPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ImagePickerModule(context))
}
