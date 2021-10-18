package expo.modules.kotlin

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.modules.Module

class ModuleHolder(val module: Module) {
  val definition = module.definition()
  val name get() = definition.name

  fun call(methodName: String, args: ReadableArray, promise: Promise) {
    val method = definition.methods[methodName].ifNull {
      promise.reject("ExpoModuleCore", "Cannot find method '$methodName' in module '${definition.name}'")
      return
    }

    method.call(args, promise)
  }
}
