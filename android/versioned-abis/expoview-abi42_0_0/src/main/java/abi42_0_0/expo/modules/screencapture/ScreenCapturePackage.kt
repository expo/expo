package abi42_0_0.expo.modules.screencapture

import android.content.Context

import abi42_0_0.org.unimodules.core.BasePackage
import abi42_0_0.org.unimodules.core.ExportedModule

class ScreenCapturePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ScreenCaptureModule(context) as ExportedModule)
  }
}
