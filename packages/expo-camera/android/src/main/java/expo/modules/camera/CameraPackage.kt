package expo.modules.camera

import android.content.Context
import expo.modules.core.BasePackage

class CameraPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(CameraModule(context))

  override fun createViewManagers(context: Context) = listOf(CameraViewManager())
}
