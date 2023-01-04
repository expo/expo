/**
 * We used a function from the experimental STD API - typeOf (see kotlinlang.org/api/latest/jvm/stdlib/kotlin.reflect/type-of.html).
 * We shouldn't have any problem with that function, cause it's widely used in other libraries created by JetBrains like kotlinx-serializer.
 * This function is super handy if we want to receive a collection type.
 * For example, it's very hard to obtain the generic parameter type from the list class.
 * In plain Java, it's almost impossible. There is a trick to getting such information using something called TypeToken.
 * For instance, the Gson library uses this workaround. But there still will be a problem with nullability.
 * We didn't find a good solution to distinguish between List<Any?> and List<Any>.
 * Mainly because from the JVM perspective it's the same type.
 * That's why we used typeOf. It solves all problems described above.
 */
@file:OptIn(ExperimentalStdlibApi::class)
@file:Suppress("FunctionName")

package expo.modules.kotlin.objects

import expo.modules.kotlin.Promise
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.functions.AsyncFunction
import expo.modules.kotlin.functions.AsyncFunctionBuilder
import expo.modules.kotlin.functions.AsyncFunctionComponent
import expo.modules.kotlin.functions.AsyncFunctionWithPromiseComponent
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

/**
 * Base class for other definitions representing an object, such as `ModuleDefinition`.
 */
open class ObjectDefinitionBuilder {
  private var constantsProvider = { emptyMap<String, Any?>() }
  private var eventsDefinition: EventsDefinition? = null

  @PublishedApi
  internal var syncFunctions = mutableMapOf<String, SyncFunctionComponent>()

  @PublishedApi
  internal var asyncFunctions = mutableMapOf<String, AsyncFunction>()

  private var functionBuilders = mutableMapOf<String, AsyncFunctionBuilder>()

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
      syncFunctions,
      asyncFunctions + functionBuilders.mapValues { (_, value) -> value.build() },
      eventsDefinition,
      properties.mapValues { (_, value) -> value.build() }
    )
  }

  private fun containsFunction(functionName: String): Boolean {
    return syncFunctions.containsKey(functionName) ||
      asyncFunctions.containsKey(functionName) ||
      functionBuilders.containsKey(functionName)
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
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType())) { body(it[0] as P0) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { body(it[0] as P0, it[1] as P1) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      syncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType(), typeOf<P7>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
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
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType())) { body(it[0] as P0) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): AsyncFunction {
    return if (P1::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(typeOf<P0>().toAnyType())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { body(it[0] as P0, it[1] as P1) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): AsyncFunction {
    return if (P2::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, promise as P2) }
    } else {
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): AsyncFunction {
    return if (P3::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, promise as P3) }
    } else {
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): AsyncFunction {
    return if (P4::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, promise as P4) }
    } else {
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): AsyncFunction {
    return if (P5::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, promise as P5) }
    } else {
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): AsyncFunction {
    return if (P6::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, promise as P6) }
    } else {
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): AsyncFunction {
    return if (P7::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6, promise as P7) }
    } else {
      AsyncFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType(), typeOf<P7>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  fun AsyncFunction(
    name: String
  ) = AsyncFunctionBuilder(name).also { functionBuilders[name] = it }

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
  fun Property(name: String): PropertyComponentBuilder {
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
