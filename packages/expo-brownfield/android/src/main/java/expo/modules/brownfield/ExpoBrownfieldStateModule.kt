package expo.modules.brownfield

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val NATIVE_MESSAGE_EVENT_NAME_2 = "onStateChange"

class ExpoBrownfieldStateModule : Module() {
  private val stores: MutableMap<String, Any> = mutableMapOf()

  override fun definition() = ModuleDefinition {
    Name("ExpoBrownfieldStateModule")

    Events(NATIVE_MESSAGE_EVENT_NAME_2)

    OnCreate {
      BrownfieldState.setExpoModule(this@ExpoBrownfieldStateModule)
    }

    Function("get") { key: String -> 
      return@Function stores[key]
    }

    Function("set") { key: String, value: Map<String, Any?> ->
      stores[key] = value
      BrownfieldState.onChange(key, value)
      return@Function value
    }
  }

  fun set(key: String, value: Map<String, Any?>) {
    stores[key] = value
    sendEvent(NATIVE_MESSAGE_EVENT_NAME_2, value)
    BrownfieldState.onChange(key, value)
  }
}

object BrownfieldState {
  private var expoModule: ExpoBrownfieldStateModule? = null
  private val listeners: MutableMap<String, MutableList<(Map<String, Any?>) -> Unit>> = mutableMapOf()

  fun subscribe(key: String, callback: (Map<String, Any?>) -> Unit) {
    if (!listeners.containsKey(key)) {
      listeners[key] = mutableListOf()
    }
    listeners[key]?.add(callback)
  }

  fun set(key: String, value: Map<String, Any?>) {
    expoModule?.set(key, value)
  }

  internal fun onChange(key: String, value: Map<String, Any?>) {
    listeners[key]?.forEach { it(value) }
  }

  internal fun setExpoModule(expoModule: ExpoBrownfieldStateModule?) {
    this.expoModule = expoModule
  }
}
