package abi39_0_0.expo.modules.splashscreen

import android.content.Context
import abi39_0_0.expo.modules.splashscreen.SplashScreenModule

import abi39_0_0.org.unimodules.core.BasePackage
import abi39_0_0.org.unimodules.core.ExportedModule
import org.unimodules.core.interfaces.SingletonModule

class SplashScreenPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SplashScreenModule(context))
  }

  override fun createSingletonModules(context: Context?): List<SingletonModule> {
    return listOf(SplashScreen)
  }
}
