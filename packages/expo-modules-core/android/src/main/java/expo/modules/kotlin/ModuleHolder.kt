package expo.modules.kotlin

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ModuleHolder(val definition: ModuleDefinition) {
  val module by lazy<Module> {
    definition.type.newInstance()
  }

  val name get() = definition.name

  fun call(methodName: String, args: ReadableArray, promise: Promise) {
    val method = definition.methods[methodName]
    if (method == null) {
      promise.reject("ExpoModuleCore", "Cannot find method '$methodName' in module '${definition.name}'")
      return
    }

    method.call(module, args, promise)
  }
}
