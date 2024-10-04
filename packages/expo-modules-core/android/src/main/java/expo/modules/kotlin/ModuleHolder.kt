package expo.modules.kotlin

import com.facebook.react.bridge.Arguments
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.MethodNotFoundException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.functions.AsyncFunction
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.objects.ObjectDefinitionData
import expo.modules.kotlin.tracing.trace
import kotlinx.coroutines.launch
import kotlin.reflect.KClass

class ModuleHolder<T : Module>(val module: T) {
  val definition = module.definition()

  val name get() = definition.name

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
      val runtimeContext = module.runtimeContext
      val jniDeallocator = runtimeContext.jniDeallocator

      val moduleDecorator = JSDecoratorsBridgingObject(jniDeallocator)
      attachPrimitives(appContext, definition.objectDefinition, moduleDecorator, name)

      // Give the module object a name. It's used for compatibility reasons, see `EventEmitter.ts`.
      moduleDecorator.registerProperty("__expo_module_name__", false, emptyArray(), { name }, false, emptyArray(), null)

      val viewFunctions = definition.viewManagerDefinition?.asyncFunctions
      if (viewFunctions?.isNotEmpty() == true) {
        trace("Attaching view prototype") {
          val viewDecorator = JSDecoratorsBridgingObject(jniDeallocator)
          viewFunctions.forEach { function ->
            function.attachToJSObject(appContext, viewDecorator, "${name}_${definition.viewManagerDefinition?.viewType?.name}")
          }

          moduleDecorator.registerObject("ViewPrototype", viewDecorator)
        }
      }

      trace("Attaching classes") {
        definition.classData.forEach { clazz ->
          val prototypeDecorator = JSDecoratorsBridgingObject(jniDeallocator)

          attachPrimitives(appContext, clazz.objectDefinition, prototypeDecorator, clazz.name)

          val constructor = clazz.constructor
          val ownerClass = (constructor.ownerType?.classifier as? KClass<*>)?.java

          moduleDecorator.registerClass(
            clazz.name,
            prototypeDecorator,
            constructor.takesOwner,
            ownerClass,
            clazz.isSharedRef,
            constructor.getCppRequiredTypes().toTypedArray(),
            constructor.getJNIFunctionBody(clazz.name, appContext)
          )
        }
      }

      JavaScriptModuleObject(jniDeallocator, name).apply {
        decorate(moduleDecorator)
      }
    }
  }

  private fun attachPrimitives(appContext: AppContext, definition: ObjectDefinitionData, moduleDecorator: JSDecoratorsBridgingObject, name: String) {
    trace("Exporting constants") {
      val constants = definition.constantsProvider()
      val convertedConstants = Arguments.makeNativeMap(constants)

      moduleDecorator.registerConstants(convertedConstants)
    }

    trace("Attaching functions") {
      definition
        .functions
        .forEach { function ->
          function.attachToJSObject(appContext, moduleDecorator, name)
        }
    }

    trace("Attaching properties") {
      definition
        .properties
        .forEach { (_, prop) ->
          prop.attachToJSObject(appContext, moduleDecorator)
        }
    }
  }

  /**
   * Invokes a function with promise. Is used in the bridge implementation of the Sweet API.
   */
  fun call(methodName: String, args: Array<Any?>, promise: Promise) = exceptionDecorator({
    FunctionCallException(methodName, definition.name, it)
  }) {
    val method = definition.asyncFunctions[methodName]
      ?: throw MethodNotFoundException()

    if (method is AsyncFunction) {
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
