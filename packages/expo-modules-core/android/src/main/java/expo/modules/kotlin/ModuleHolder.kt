package expo.modules.kotlin

import android.view.View
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.MethodNotFoundException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.tracing.trace
import kotlinx.coroutines.launch
import kotlin.reflect.KClass

class ModuleHolder(val module: Module) {
  val definition = module.definition()

  val name get() = definition.name

  /**
   * Cached instance of HybridObject used by CPP to interact with underlying [expo.modules.kotlin.modules.Module] object.
   */
  val jsObject by lazy {
    trace("$name.jsObject") {
      val appContext = module.appContext
      val jniDeallocator = appContext.jniDeallocator

      JavaScriptModuleObject(jniDeallocator, name).apply {
        initUsingObjectDefinition(appContext, definition.objectDefinition)

        val viewFunctions = definition.viewManagerDefinition?.asyncFunctions
        if (viewFunctions?.isNotEmpty() == true) {
          val viewPrototype = JavaScriptModuleObject(jniDeallocator, "${name}_${definition.viewManagerDefinition?.viewType?.name}")
          appContext.jniDeallocator.addReference(viewPrototype)

          viewFunctions.forEach { function ->
            function.attachToJSObject(appContext, viewPrototype)
          }

          registerViewPrototype(viewPrototype)
        }

        definition.classData.forEach { clazz ->
          val clazzModuleObject = JavaScriptModuleObject(jniDeallocator, clazz.name)
            .initUsingObjectDefinition(module.appContext, clazz.objectDefinition)
          appContext.jniDeallocator.addReference(clazzModuleObject)

          val constructor = clazz.constructor
          registerClass(
            clazz.name,
            clazzModuleObject,
            constructor.takesOwner,
            constructor.argsCount,
            constructor.getCppRequiredTypes().toTypedArray(),
            constructor.getJNIFunctionBody(clazz.name, appContext)
          )
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
    val method = definition.asyncFunctions[methodName]
      ?: throw MethodNotFoundException()

    method.call(this, args, promise)
  }

  /**
   * Invokes a function without promise.
   * `callSync` was added only for test purpose and shouldn't be used anywhere else.
   */
  fun callSync(methodName: String, args: ReadableArray): Any? {
    val method = definition.syncFunctions[methodName]
      ?: throw MethodNotFoundException()

    return method.call(args)
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

  fun registerContracts() {
    definition.registerContracts?.let {
      module.appContext.mainQueue.launch {
        it.invoke(module.appContext.appContextActivityResultCaller)
      }
    }
  }

  fun viewClass(): KClass<out View>? {
    return definition.viewManagerDefinition?.viewType?.kotlin
  }
}
