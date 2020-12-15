package abi40_0_0.expo.modules.screencapture

import android.content.Context

import abi40_0_0.org.unimodules.core.BasePackage
import abi40_0_0.org.unimodules.core.ExportedModule
import abi40_0_0.org.unimodules.core.ViewManager

class ScreenCapturePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ScreenCaptureModule(context) as ExportedModule)
  }
}

