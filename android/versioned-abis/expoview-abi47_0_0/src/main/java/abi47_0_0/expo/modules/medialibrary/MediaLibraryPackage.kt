package abi47_0_0.expo.modules.medialibrary

import android.content.Context
import abi47_0_0.expo.modules.core.BasePackage

class MediaLibraryPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(MediaLibraryModule(context))
}
