package expo.modules.brownfield

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBrownfieldStateModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBrownfieldStateModule")

    Class(SharedState::class) {
      Constructor { SharedState() }

      Function("get") { state: SharedState ->
        return@Function state.get()
      }

      Function("set") { state: SharedState, value: Any? -> state.set(value) }
    }

    Function("getSharedState") { key: String ->
      return@Function BrownfieldState.getOrCreate(key)
    }

    Function("deleteSharedState") { key: String -> BrownfieldState.delete(key) }
  }
}
