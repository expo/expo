package expo.modules.imageloader

import android.content.Context
import org.unimodules.core.BasePackage
import org.unimodules.core.interfaces.InternalModule

class ImageLoaderPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> = listOf(ImageLoaderModule(context))
}
