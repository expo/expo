package abi44_0_0.expo.modules.camera

import android.content.Context
import abi44_0_0.expo.modules.core.BasePackage

class CameraPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(CameraModule(context))

  override fun createViewManagers(context: Context) = listOf(CameraViewManager())
}
