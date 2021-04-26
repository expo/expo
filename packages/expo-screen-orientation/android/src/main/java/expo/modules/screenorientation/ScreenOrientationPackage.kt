package expo.modules.screenorientation

import android.content.Context
import org.unimodules.core.BasePackage

class ScreenOrientationPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ScreenOrientationModule(context))
}
