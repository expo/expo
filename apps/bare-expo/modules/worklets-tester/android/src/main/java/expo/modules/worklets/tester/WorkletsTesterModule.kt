package expo.modules.worklets.tester

import expo.modules.kotlin.jni.worklets.Worklet
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WorkletsTesterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WorkletsTesterModule")

    Function("executeWorklet") { worklet: Worklet ->
      worklet.execute(appContext.uiRuntime)
    }

    Function("scheduleWorklet") { worklet: Worklet ->
      worklet.schedule(appContext.uiRuntime)
    }
  }
}
