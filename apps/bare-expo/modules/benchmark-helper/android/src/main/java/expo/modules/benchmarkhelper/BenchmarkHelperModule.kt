package expo.modules.benchmarkhelper

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BenchmarkHelperModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BenchmarkHelperModule")

    Function("reportFullyDrawn") {
      BenchmarkManager.reportFullyDrawn(appContext.currentActivity)
    }
  }
}
