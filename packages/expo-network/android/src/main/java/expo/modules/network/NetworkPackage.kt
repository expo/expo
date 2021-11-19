package expo.modules.network

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class NetworkPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(NetworkModule(context))
}
