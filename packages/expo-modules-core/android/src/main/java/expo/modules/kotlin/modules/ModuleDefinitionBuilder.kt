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

package expo.modules.kotlin.modules

import android.app.Activity
import android.content.Intent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.events.OnActivityResultPayload
import expo.modules.kotlin.functions.AnyFunction
import expo.modules.kotlin.functions.AsyncFunction
import expo.modules.kotlin.functions.AsyncFunctionWithPromise
import expo.modules.kotlin.functions.AsyncFunctionBuilder
import expo.modules.kotlin.types.toAnyType
import expo.modules.kotlin.views.ViewManagerDefinition
import expo.modules.kotlin.views.ViewManagerDefinitionBuilder
import kotlin.reflect.typeOf

@DefinitionMarker
class ModuleDefinitionBuilder(@PublishedApi internal val module: Module? = null) {
  private var name: String? = null
  private var constantsProvider = { emptyMap<String, Any?>() }
  private var eventsDefinition: EventsDefinition? = null
  private var functionBuilders = mutableListOf<AsyncFunctionBuilder>()

  @PublishedApi
  internal var methods = mutableMapOf<String, AnyFunction>()

  @PublishedApi
  internal var viewManagerDefinition: ViewManagerDefinition? = null

  @PublishedApi
  internal val eventListeners = mutableMapOf<EventName, EventListener>()

  fun build(): ModuleDefinitionData {
    val moduleName = name ?: module?.javaClass?.simpleName

    return ModuleDefinitionData(
      requireNotNull(moduleName),
      constantsProvider,
      methods + functionBuilders.associate { it.build() },
      viewManagerDefinition,
      eventListeners,
      eventsDefinition
    )
  }

  @Deprecated(
    message = "The 'name' component was renamed to 'Name'.",
    replaceWith = ReplaceWith("Name(name)")
  )
  fun name(name: String) = Name(name)

  /**
   * Sets the name of the module that is exported to the JavaScript world.
   */
  fun Name(name: String) {
    this.name = name
  }

  @Deprecated(
    message = "The 'constants' component was renamed to 'Constants'.",
    replaceWith = ReplaceWith("Constants(constantsProvider)")
  )
  fun constants(constantsProvider: () -> Map<String, Any?>) = Constants(constantsProvider)

  /**
   * Definition function setting the module's constants to export.
   */
  fun Constants(constantsProvider: () -> Map<String, Any?>) {
    this.constantsProvider = constantsProvider
  }

  @Deprecated(
    message = "The 'constants' component was renamed to 'Constants'.",
    replaceWith = ReplaceWith("Constants(constants)")
  )
  fun constants(vararg constants: Pair<String, Any?>) = Constants(*constants)

  /**
   * Definition of the module's constants to export.
   */
  fun Constants(vararg constants: Pair<String, Any?>) {
    constantsProvider = { constants.toMap() }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  @JvmName("functionWithoutArgs")
  inline fun function(
    name: String,
    crossinline body: () -> Any?
  ) {
    methods[name] = AsyncFunction(name, arrayOf()) { body() }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R> function(
    name: String,
    crossinline body: () -> R
  ) {
    methods[name] = AsyncFunction(name, arrayOf()) { body() }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0> function(
    name: String,
    crossinline body: (p0: P0) -> R
  ) {
    methods[name] = if (P0::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf()) { _, promise -> body(promise as P0) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType())) { body(it[0] as P0) }
    }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1> function(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ) {
    methods[name] = if (P1::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { body(it[0] as P0, it[1] as P1) }
    }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ) {
    methods[name] = if (P2::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, promise as P2) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }
    }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ) {
    methods[name] = if (P3::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, promise as P3) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
    }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ) {
    methods[name] = if (P4::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, promise as P4) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
    }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ) {
    methods[name] = if (P5::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, promise as P5) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
    }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ) {
    methods[name] = if (P6::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, promise as P6) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
    }
  }

  @Deprecated(
    message = "The 'function' component was deprecated and will change its behavior in the future.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ) {
    methods[name] = if (P7::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6, promise as P7) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType(), typeOf<P7>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  @JvmName("asyncFunctionWithoutArgs")
  inline fun asyncFunction(
    name: String,
    crossinline body: () -> Any?
  ) = AsyncFunction(name, body)

  @JvmName("AsyncFunctionWithoutArgs")
  inline fun AsyncFunction(
    name: String,
    crossinline body: () -> Any?
  ) {
    methods[name] = AsyncFunction(name, arrayOf()) { body() }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R> asyncFunction(
    name: String,
    crossinline body: () -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R> AsyncFunction(
    name: String,
    crossinline body: () -> R
  ) {
    methods[name] = AsyncFunction(name, arrayOf()) { body() }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0> asyncFunction(
    name: String,
    crossinline body: (p0: P0) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: (p0: P0) -> R
  ) {
    methods[name] = if (P0::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf()) { _, promise -> body(promise as P0) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType())) { body(it[0] as P0) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1> asyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ) {
    methods[name] = if (P1::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { body(it[0] as P0, it[1] as P1) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2> asyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ) {
    methods[name] = if (P2::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, promise as P2) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> asyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ) {
    methods[name] = if (P3::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, promise as P3) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> asyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ) {
    methods[name] = if (P4::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, promise as P4) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> asyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ) {
    methods[name] = if (P5::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, promise as P5) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> asyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ) {
    methods[name] = if (P6::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, promise as P6) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> asyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ) = AsyncFunction(name, body)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ) {
    methods[name] = if (P7::class == Promise::class) {
      AsyncFunctionWithPromise(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6, promise as P7) }
    } else {
      AsyncFunction(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType(), typeOf<P7>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
    }
  }

  @Deprecated(
    message = "The 'asyncFunction' component was renamed to 'AsyncFunction'.",
    replaceWith = ReplaceWith("AsyncFunction(name, body)")
  )
  fun asyncFunction(
    name: String
  ) = AsyncFunction(name)

  fun AsyncFunction(
    name: String
  ) = AsyncFunctionBuilder(name).also { functionBuilders.add(it) }

  @Deprecated(
    message = "The 'viewManager' component was renamed to 'ViewManager'.",
    replaceWith = ReplaceWith("ViewManager(body)")
  )
  inline fun viewManager(body: ViewManagerDefinitionBuilder.() -> Unit) = ViewManager(body)

  /**
   * Creates the view manager definition that scopes other view-related definitions.
   */
  inline fun ViewManager(body: ViewManagerDefinitionBuilder.() -> Unit) {
    require(viewManagerDefinition == null) { "The module definition may have exported only one view manager." }

    val viewManagerDefinitionBuilder = ViewManagerDefinitionBuilder()
    body.invoke(viewManagerDefinitionBuilder)
    viewManagerDefinition = viewManagerDefinitionBuilder.build()
  }

  @Deprecated(
    message = "The 'onCreate' component was renamed to 'OnCreate'.",
    replaceWith = ReplaceWith("OnCreate(body)")
  )
  inline fun onCreate(crossinline body: () -> Unit) = OnCreate(body)

  /**
   * Creates module's lifecycle listener that is called right after the module initialization.
   */
  inline fun OnCreate(crossinline body: () -> Unit) {
    eventListeners[EventName.MODULE_CREATE] = BasicEventListener(EventName.MODULE_CREATE) { body() }
  }

  @Deprecated(
    message = "The 'onDestroy' component was renamed to 'OnDestroy'.",
    replaceWith = ReplaceWith("OnDestroy(body)")
  )
  inline fun onDestroy(crossinline body: () -> Unit) = OnDestroy(body)

  /**
   * Creates module's lifecycle listener that is called when the module is about to be deallocated.
   */
  inline fun OnDestroy(crossinline body: () -> Unit) {
    eventListeners[EventName.MODULE_DESTROY] = BasicEventListener(EventName.MODULE_DESTROY) { body() }
  }

  @Deprecated(
    message = "The 'onActivityEntersForeground' component was renamed to 'OnActivityEntersForeground'.",
    replaceWith = ReplaceWith("OnActivityEntersForeground(body)")
  )
  inline fun onActivityEntersForeground(crossinline body: () -> Unit) = OnActivityEntersForeground(body)

  /**
   * Creates module's lifecycle listener that is called right after the activity is resumed.
   */
  inline fun OnActivityEntersForeground(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_ENTERS_FOREGROUND] = BasicEventListener(EventName.ACTIVITY_ENTERS_FOREGROUND) { body() }
  }

  @Deprecated(
    message = "The 'onActivityEntersBackground' component was renamed to 'OnActivityEntersBackground'.",
    replaceWith = ReplaceWith("OnActivityEntersBackground(body)")
  )
  inline fun onActivityEntersBackground(crossinline body: () -> Unit) = OnActivityEntersBackground(body)

  /**
   * Creates module's lifecycle listener that is called right after the activity is paused.
   */
  inline fun OnActivityEntersBackground(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_ENTERS_BACKGROUND] = BasicEventListener(EventName.ACTIVITY_ENTERS_BACKGROUND) { body() }
  }

  @Deprecated(
    message = "The 'onActivityDestroys' component was renamed to 'OnActivityDestroys'.",
    replaceWith = ReplaceWith("OnActivityDestroys(body)")
  )
  inline fun onActivityDestroys(crossinline body: () -> Unit) = OnActivityDestroys(body)

  /**
   * Creates module's lifecycle listener that is called right after the activity is destroyed.
   */
  inline fun OnActivityDestroys(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_DESTROYS] = BasicEventListener(EventName.ACTIVITY_DESTROYS) { body() }
  }

  @Deprecated(
    message = "The 'events' component was renamed to 'Events'.",
    replaceWith = ReplaceWith("Events(events)")
  )
  fun events(vararg events: String) = Events(*events)

  /**
   * Defines event names that this module can send to JavaScript.
   */
  fun Events(vararg events: String) {
    eventsDefinition = EventsDefinition(events)
  }

  @Deprecated(
    message = "The 'onStartObserving' component was renamed to 'OnStartObserving'.",
    replaceWith = ReplaceWith("OnStartObserving(body)")
  )
  inline fun onStartObserving(crossinline body: () -> Unit) = OnStartObserving(body)

  /**
   * Creates module's lifecycle listener that is called right after the first event listener is added.
   */
  inline fun OnStartObserving(crossinline body: () -> Unit) {
    AsyncFunction("startObserving", body)
  }

  @Deprecated(
    message = "The 'onStopObserving' component was renamed to 'OnStopObserving'.",
    replaceWith = ReplaceWith("OnStopObserving(body)")
  )
  inline fun onStopObserving(crossinline body: () -> Unit) = OnStopObserving(body)

  /**
   * Creates module's lifecycle listener that is called right after all event listeners are removed.
   */
  inline fun OnStopObserving(crossinline body: () -> Unit) {
    AsyncFunction("stopObserving", body)
  }

  @Deprecated(
    message = "The 'onNewIntent' component was renamed to 'OnNewIntent'.",
    replaceWith = ReplaceWith("OnNewIntent(body)")
  )
  inline fun onNewIntent(crossinline body: (Intent) -> Unit) = OnNewIntent(body)

  /**
   * Creates module's lifecycle listener that is called right after the new intent was received.
   */
  inline fun OnNewIntent(crossinline body: (Intent) -> Unit) {
    eventListeners[EventName.ON_NEW_INTENT] = EventListenerWithPayload<Intent>(EventName.ON_NEW_INTENT) { body(it) }
  }

  @Deprecated(
    message = "The 'onActivityResult' component was renamed to 'OnActivityResult'.",
    replaceWith = ReplaceWith("OnActivityResult(body)")
  )
  inline fun onActivityResult(crossinline body: (Activity, OnActivityResultPayload) -> Unit) = OnActivityResult(body)

  /**
   * Creates module's lifecycle listener that is called right after the activity has received a result.
   */
  inline fun OnActivityResult(crossinline body: (Activity, OnActivityResultPayload) -> Unit) {
    eventListeners[EventName.ON_ACTIVITY_RESULT] =
      EventListenerWithSenderAndPayload<Activity, OnActivityResultPayload>(EventName.ON_ACTIVITY_RESULT) { sender, payload -> body(sender, payload) }
  }
}
