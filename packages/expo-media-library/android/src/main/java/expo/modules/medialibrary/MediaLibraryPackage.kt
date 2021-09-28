package expo.modules.medialibrary

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.medialibrary.MediaLibraryModule

class MediaLibraryPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(MediaLibraryModule(context))
}
