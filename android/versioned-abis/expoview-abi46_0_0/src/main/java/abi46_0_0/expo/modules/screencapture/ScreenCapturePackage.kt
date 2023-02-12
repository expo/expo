package abi46_0_0.expo.modules.screencapture

import android.content.Context

import abi46_0_0.expo.modules.core.BasePackage
import abi46_0_0.expo.modules.core.ExportedModule

class ScreenCapturePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ScreenCaptureModule(context) as ExportedModule)
  }
}
