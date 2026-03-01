package expo.modules.brownfield

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val KEY_RECREATED_EVENT_NAME = "onKeyRecreated"

class ExpoBrownfieldStateModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBrownfieldStateModule")

    Events(KEY_RECREATED_EVENT_NAME)

    Class(SharedState::class) {
      Constructor { key: String -> SharedState(key) }

      Function("get") { state: SharedState ->
        return@Function state.get()
      }

      Function("set") { state: SharedState, value: Any? -> state.set(value) }
    }

    OnCreate { BrownfieldState.setExpoModule(this@ExpoBrownfieldStateModule) }

    OnDestroy { BrownfieldState.setExpoModule(null) }

    Function("getSharedState") { key: String ->
      return@Function BrownfieldState.getOrCreate(key)
    }

    Function("deleteSharedState") { key: String -> BrownfieldState.delete(key) }
  }

  fun notifyKeyRecreated(key: String) {
    sendEvent(KEY_RECREATED_EVENT_NAME, mapOf("key" to key))
  }
}
