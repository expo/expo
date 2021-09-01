package expo.modules.location

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.location.LocationModule

class LocationPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
      listOf(LocationModule(context))
}
