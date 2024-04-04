@file:Suppress("FunctionName")

package expo.modules.kotlin.objects

import com.facebook.react.bridge.Arguments
import expo.modules.kotlin.Promise
import expo.modules.kotlin.component6
import expo.modules.kotlin.component7
import expo.modules.kotlin.component8
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.functions.AsyncFunction
import expo.modules.kotlin.functions.AsyncFunctionBuilder
import expo.modules.kotlin.functions.AsyncFunctionWithPromiseComponent
import expo.modules.kotlin.functions.FunctionBuilder
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.functions.createAsyncFunctionComponent
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.types.toArgsArray
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor

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
    return ObjectDefinitionData(
      constantsProvider,
      syncFunctions + syncFunctionBuilder.mapValues { (_, value) -> value.build() },
      asyncFunctions + asyncFunctionBuilders.mapValues { (_, value) -> value.build() },
      eventsDefinition,
      properties.mapValues { (_, value) -> value.build() }
    )
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
    return SyncFunctionComponent(name, emptyArray()) { body() }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R> Function(
    name: String,
    crossinline body: () -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, emptyArray()) { body() }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0> Function(
    name: String,
    crossinline body: (p0: P0) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0>()) { (p0) ->
      enforceType<P0>(p0)
      body(p0)
    }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0, P1>()) { (p0, p1) ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1)
    }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2) ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2)
    }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3) ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3)
    }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4) ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4)
    }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5) ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5)
    }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6)
    }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6, P7>()) { (p0, p1, p2, p3, p4, p5, p6, p7) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6, P7>(p0, p1, p2, p3, p4, p5, p6, p7)
      body(p0, p1, p2, p3, p4, p5, p6, p7)
    }.also {
      syncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithoutArgs")
  inline fun AsyncFunction(
    name: String,
    crossinline body: () -> Any?
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R> AsyncFunction(
    name: String,
    crossinline body: () -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: (p0: P0) -> R
  ): AsyncFunction {
    // We can't split that function, because that introduces a ambiguity when creating DSL component without parameters.
    return if (P0::class.java == Promise::class.java) {
      AsyncFunctionWithPromiseComponent(name, arrayOf()) { _, promise -> body(promise as P0) }
    } else {
      createAsyncFunctionComponent(name, toArgsArray<P0>()) { (p0) ->
        enforceType<P0>(p0)
        body(p0)
      }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1>()) { (p0, p1) ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: Promise) -> R
  ): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0>()) { (p0), promise ->
      enforceType<P0>(p0)
      body(p0, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2) ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: Promise) -> R
  ): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1>()) { (p0, p1), promise ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3) ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: Promise) -> R
  ): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2), promise ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4) ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: Promise) -> R
  ): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3), promise ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5) ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: Promise) -> R
  ): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4), promise ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: Promise) -> R
  ): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5), promise ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6, P7>()) { (p0, p1, p2, p3, p4, p5, p6, p7) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6, P7>(p0, p1, p2, p3, p4, p5, p6, p7)
      body(p0, p1, p2, p3, p4, p5, p6, p7)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: Promise) -> R
  ): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6), promise ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6, promise)
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
    @Suppress("UNUSED_ANONYMOUS_PARAMETER")
    AsyncFunction("startObserving") { eventName: String? -> body() }
  }

  /**
   * Creates module's lifecycle listener that is called right after all event listeners are removed.
   */
  inline fun OnStopObserving(crossinline body: () -> Unit) {
    @Suppress("UNUSED_ANONYMOUS_PARAMETER")
    AsyncFunction("stopObserving") { eventName: String? -> body() }
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
