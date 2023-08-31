@file:Suppress("FunctionName")

package expo.modules.kotlin.objects

import com.facebook.react.bridge.Arguments
import expo.modules.kotlin.Promise
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.functions.AsyncFunction
import expo.modules.kotlin.functions.AsyncFunctionBuilder
import expo.modules.kotlin.functions.AsyncFunctionComponent
import expo.modules.kotlin.functions.AsyncFunctionWithPromiseComponent
import expo.modules.kotlin.functions.FunctionBuilder
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.typeOf

/**
 * Base class for other definitions representing an object, such as `ModuleDefinition`.
 */
open class ObjectDefinitionBuilder {
  private var constantsProvider = { emptyMap<String, Any?>() }

  @PublishedApi
  internal var eventsDefinition: EventsDefinition? = null

  @PublishedApi
  internal var syncFunctions = mutableMapOf<String, SyncFunctionComponent>()

  @PublishedApi
  internal var syncFunctionBuilder = mutableMapOf<String, FunctionBuilder>()

  @PublishedApi
  internal var asyncFunctions = mutableMapOf<String, AsyncFunction>()

  private var asyncFunctionBuilders = mutableMapOf<String, AsyncFunctionBuilder>()

  @PublishedApi
  internal var properties = mutableMapOf<String, PropertyComponentBuilder>()

  fun buildObject(): ObjectDefinitionData {
    // Register stub functions to bypass react-native `NativeEventEmitter` warnings
    // WARN  `new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.
    // WARN  `new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.
    eventsDefinition?.run {
      if (!containsFunction("addListener")) {
        Function("addListener") { _: String -> { } }
      }
      if (!containsFunction("removeListeners")) {
        Function("removeListeners") { _: Int -> { } }
      }
    }

    return ObjectDefinitionData(
      constantsProvider,
      syncFunctions + syncFunctionBuilder.mapValues { (_, value) -> value.build() },
      asyncFunctions + asyncFunctionBuilders.mapValues { (_, value) -> value.build() },
      eventsDefinition,
      properties.mapValues { (_, value) -> value.build() }
    )
  }

  private fun containsFunction(functionName: String): Boolean {
    return syncFunctions.containsKey(functionName) ||
      asyncFunctions.containsKey(functionName) ||
      asyncFunctionBuilders.containsKey(functionName)
  }

  /**
   * Definition function setting the module's constants to export.
   */
  fun Constants(constantsProvider: () -> Map<String, Any?>) {
    this.constantsProvider = constantsProvider
  }

  /**
   * Definition of the module's constants to export.
   */
  fun Constants(vararg constants: Pair<String, Any?>) {
    constantsProvider = { constants.toMap() }
  }

  fun Function(
    name: String
  ) = FunctionBuilder(name).also { syncFunctionBuilder[name] = it }

  @JvmName("FunctionWithoutArgs")
  inline fun Function(
    name: String,
    crossinline body: () -> Any?
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf()) { body() }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R> Function(
    name: String,
    crossinline body: () -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf()) { body() }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0> Function(
    name: String,
    crossinline body: (p0: P0) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>())) { body(it[0] as P0) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>())) { body(it[0] as P0, it[1] as P1) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>(), { typeOf<P7>() }.toAnyType<P7>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
      syncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithoutArgs")
  inline fun AsyncFunction(
    name: String,
    crossinline body: () -> Any?
  ): AsyncFunction {
    return AsyncFunctionComponent(name, arrayOf()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R> AsyncFunction(
    name: String,
    crossinline body: () -> R
  ): AsyncFunction {
    return AsyncFunctionComponent(name, arrayOf()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: (p0: P0) -> R
  ): AsyncFunction {
    return if (P0::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf()) { _, promise -> body(promise as P0) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>())) { body(it[0] as P0) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): AsyncFunction {
    return if (P1::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>())) { body(it[0] as P0, it[1] as P1) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): AsyncFunction {
    return if (P2::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>())) { args, promise -> body(args[0] as P0, args[1] as P1, promise as P2) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): AsyncFunction {
    return if (P3::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, promise as P3) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): AsyncFunction {
    return if (P4::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, promise as P4) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): AsyncFunction {
    return if (P5::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, promise as P5) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): AsyncFunction {
    return if (P6::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, promise as P6) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): AsyncFunction {
    return if (P7::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6, promise as P7) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>(), { typeOf<P7>() }.toAnyType<P7>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  fun AsyncFunction(
    name: String
  ) = AsyncFunctionBuilder(name).also { asyncFunctionBuilders[name] = it }

  /**
   * Defines event names that this module can send to JavaScript.
   */
  fun Events(vararg events: String) {
    eventsDefinition = EventsDefinition(events)
  }

  /**
   * Defines event names that this module can send to JavaScript.
   */
  @JvmName("EventsWithArray")
  fun Events(events: Array<String>) {
    eventsDefinition = EventsDefinition(events)
  }

  inline fun <reified T> Events() where T : Enumerable, T : Enum<T> {
    val primaryConstructor = T::class.primaryConstructor
    val events = if (primaryConstructor?.parameters?.size == 1) {
      val parameterName = primaryConstructor.parameters.first().name

      val parameterProperty = T::class
        .declaredMemberProperties
        .find { it.name == parameterName }
      requireNotNull(parameterProperty) { "Cannot find a property for $parameterName parameter" }
      require(parameterProperty.returnType.classifier == String::class) { "The enum parameter has to be a string." }
      enumValues<T>().map {
        parameterProperty.get(it) as String
      }
    } else {
      enumValues<T>().map {
        it.name
      }
    }

    eventsDefinition = EventsDefinition(events.toTypedArray())
  }

  /**
   * Creates module's lifecycle listener that is called right after the first event listener is added.
   */
  inline fun OnStartObserving(crossinline body: () -> Unit) {
    AsyncFunction("startObserving", body)
  }

  /**
   * Creates module's lifecycle listener that is called right after all event listeners are removed.
   */
  inline fun OnStopObserving(crossinline body: () -> Unit) {
    AsyncFunction("stopObserving", body)
  }

  /**
   * Creates the property with given name. The component is basically no-op if you don't call `.get()` or `.set()` on it.
   */
  open fun Property(name: String): PropertyComponentBuilder {
    return PropertyComponentBuilder(name).also {
      properties[name] = it
    }
  }

  /**
   * Creates the read-only property whose getter doesn't take the caller as an argument.
   */
  inline fun <T> Property(name: String, crossinline body: () -> T): PropertyComponentBuilder {
    return PropertyComponentBuilder(name).also {
      it.get(body)
      properties[name] = it
    }
  }
}

inline fun ModuleDefinitionBuilder.Object(block: ObjectDefinitionBuilder.() -> Unit): JavaScriptModuleObject {
  return module!!.Object(block)
}

inline fun Module.Object(block: ObjectDefinitionBuilder.() -> Unit): JavaScriptModuleObject {
  val objectData = ObjectDefinitionBuilder().also(block).buildObject()
  return JavaScriptModuleObject(appContext.jniDeallocator, "[Anonymous Object]")
    .apply {
      val constants = objectData.constantsProvider()
      val convertedConstants = Arguments.makeNativeMap(constants)
      exportConstants(convertedConstants)

      objectData
        .functions
        .forEach { function ->
          function.attachToJSObject(appContext, this)
        }

      objectData
        .properties
        .forEach { (_, prop) ->
          prop.attachToJSObject(appContext, this)
        }
    }
}
