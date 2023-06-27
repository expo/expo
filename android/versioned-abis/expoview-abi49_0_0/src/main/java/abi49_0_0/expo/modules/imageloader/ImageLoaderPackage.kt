package abi49_0_0.expo.modules.imageloader

import android.content.Context
import abi49_0_0.expo.modules.core.BasePackage
import abi49_0_0.expo.modules.core.interfaces.InternalModule

class ImageLoaderPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> = listOf(ImageLoaderModule(context))
}
