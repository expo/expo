package expo.modules.kotlin

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableNativeArray
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.MethodNotFoundException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.JSTypeConverter
import kotlinx.coroutines.launch

class ModuleHolder(val module: Module) {
  val definition = module.definition()
  val name get() = definition.name

  /**
   * Cached instance of HybridObject used by CPP to interact with underlying [expo.modules.kotlin.modules.Module] object.
   */
  val jsObject by lazy {
    JavaScriptModuleObject()
      .apply {
        definition
          .methods
          .forEach { (name, method) ->
            val moduleHolder = this@ModuleHolder
            if (method.isSync) {
              registerSyncFunction(name, method.argsCount) { args ->
                val result = method.callSync(moduleHolder, args)
                val convertedResult = JSTypeConverter.convertToJSValue(result)
                return@registerSyncFunction Arguments.fromJavaArgs(arrayOf(convertedResult))
              }
            } else {
              registerAsyncFunction(name, method.argsCount) { args, bridgePromise ->
                val kotlinPromise = KPromiseWrapper(bridgePromise as com.facebook.react.bridge.Promise)
                moduleHolder.module.appContext.modulesQueue.launch {
                  method.call(moduleHolder, args, kotlinPromise)
                }
              }
            }
          }
      }
  }

  /**
   * Invokes a function with promise. Is used in the bridge implementation of the Sweet API.
   */
  fun call(methodName: String, args: ReadableArray, promise: Promise) = exceptionDecorator({
    FunctionCallException(methodName, definition.name, it)
  }) {
    val method = definition.methods[methodName]
      ?: throw MethodNotFoundException()

    if (method.isSync) {
      throw MethodNotFoundException()
    }

    method.call(this, args, promise)
  }

  /**
   * Invokes a function without promise.
   * `callSync` was added only for test purpose and shouldn't be used anywhere else.
   */
  fun callSync(methodName: String, args: ReadableArray): Any? = exceptionDecorator({
    FunctionCallException(methodName, definition.name, it)
  }) {
    val method = definition.methods[methodName]
      ?: throw MethodNotFoundException()

    if (!method.isSync) {
      throw MethodNotFoundException()
    }

    val result = method.callSync(this, args)
    JSTypeConverter.convertToJSValue(result)
  }

  fun post(eventName: EventName) {
    val listener = definition.eventListeners[eventName] ?: return
    (listener as? BasicEventListener)?.call()
  }

  @Suppress("UNCHECKED_CAST")
  fun <Payload> post(eventName: EventName, payload: Payload) {
    val listener = definition.eventListeners[eventName] ?: return
    (listener as? EventListenerWithPayload<Payload>)?.call(payload)
  }

  @Suppress("UNCHECKED_CAST")
  fun <Sender, Payload> post(eventName: EventName, sender: Sender, payload: Payload) {
    val listener = definition.eventListeners[eventName] ?: return
    (listener as? EventListenerWithSenderAndPayload<Sender, Payload>)?.call(sender, payload)
  }

  fun cleanUp() {
    module.cleanUp()
  }
}
