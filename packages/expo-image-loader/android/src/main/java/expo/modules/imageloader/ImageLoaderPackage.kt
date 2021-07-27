package expo.modules.imageloader

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.InternalModule

class ImageLoaderPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> = listOf(ImageLoaderModule(context))
}
