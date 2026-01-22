package expo.modules.kotlin

import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.MethodNotFoundException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.functions.AsyncFunctionComponent
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinitionData
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.tracing.trace
import kotlinx.coroutines.launch

class ModuleHolder<T : Module>(
  val module: T,
  private val _name: String?
) {
  val definition: ModuleDefinitionData
    get() {
      try {
        return module.definition()
      } catch (e: Exception) {
        throw e
      }
    }

  val name get() = _name ?: definition.name

  private var wasInitialized = false

  val safeJSObject: JavaScriptModuleObject?
    get() = if (wasInitialized) {
      jsObject
    } else {
      null
    }

  /**
   * Cached instance of HybridObject used by CPP to interact with underlying [expo.modules.kotlin.modules.Module] object.
   */
  val jsObject by lazy {
    wasInitialized = true

    trace("$name.jsObject") {
      val appContext = module.appContext
      val runtimeContext = module.runtime
      val deallocator = runtimeContext.deallocator

      val moduleDecorator = JSDecoratorsBridgingObject(deallocator).apply {
        export(
          appContext,
          runtimeContext
        )
      }

      JavaScriptModuleObject(deallocator, name).apply {
        decorate(moduleDecorator)
      }
    }
  }

  private fun JSDecoratorsBridgingObject.export(
    appContext: AppContext,
    runtime: Runtime
  ) {
    // Give the module object a name. It's used for compatibility reasons, see `EventEmitter.ts`.
    registerModuleName(name)

    with(definition) {
      objectDefinition.apply {
        exportConstants()
        exportFunctions(name, appContext)
        exportProperties(appContext)
      }

      viewManagerDefinitions
        .exportViewPrototypes(name, appContext, runtime)

      classData
        .exportClasses(appContext, runtime)
    }
  }

  /**
   * Invokes a function with promise. Is used in the bridge implementation of the Sweet API.
   */
  fun call(methodName: String, args: Array<Any?>, promise: Promise) = exceptionDecorator({
    FunctionCallException(methodName, name, it)
  }) {
    val method = definition.asyncFunctions[methodName]
      ?: throw MethodNotFoundException()

    if (method is AsyncFunctionComponent) {
      method.callUserImplementation(args, promise, module.appContext)
      return@exceptionDecorator
    }

    throw IllegalStateException("Cannot call a $method method in test context")
  }

  /**
   * Invokes a function without promise.
   * `callSync` was added only for test purpose and shouldn't be used anywhere else.
   */
  fun callSync(methodName: String, args: Array<Any?>): Any? {
    val method = definition.syncFunctions[methodName]
      ?: throw MethodNotFoundException()

    return method.callUserImplementation(args)
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
}
