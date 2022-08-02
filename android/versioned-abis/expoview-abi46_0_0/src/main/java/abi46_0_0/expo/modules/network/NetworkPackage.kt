package abi46_0_0.expo.modules.network

import android.content.Context

import abi46_0_0.expo.modules.core.BasePackage
import abi46_0_0.expo.modules.core.ExportedModule

class NetworkPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(NetworkModule(context))
}
