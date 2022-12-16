package expo.modules.medialibrary

import android.content.Context
import expo.modules.core.BasePackage

class MediaLibraryPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(MediaLibraryModule(context))
}
