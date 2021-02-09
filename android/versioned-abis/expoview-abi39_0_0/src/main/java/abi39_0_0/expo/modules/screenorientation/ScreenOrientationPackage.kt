package abi39_0_0.expo.modules.screenorientation

import android.content.Context
import abi39_0_0.org.unimodules.core.BasePackage

class ScreenOrientationPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(ScreenOrientationModule(context))

}
