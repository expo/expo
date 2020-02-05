package expo.modules.splashscreen

import android.content.Context
import expo.modules.splashscreen.SplashScreenModule

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.interfaces.SingletonModule

class SplashScreenPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SplashScreenModule(context))
  }

  override fun createSingletonModules(context: Context?): List<SingletonModule> {
    return listOf(SplashScreen)
  }
}
