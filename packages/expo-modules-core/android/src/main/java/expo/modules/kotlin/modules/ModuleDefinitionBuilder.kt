package expo.modules.kotlin.modules

import expo.modules.core.Promise
import expo.modules.kotlin.methods.AnyMethod
import expo.modules.kotlin.methods.Method
import expo.modules.kotlin.methods.PromiseMethod
import expo.modules.kotlin.methods.TypeInformation

class ModuleDefinitionBuilder {
  private var name: String? = null
  private var constantsProvider = { emptyMap<String, Any?>() }
  var methods = mutableMapOf<String, AnyMethod>()

  fun build(): ModuleDefinition {
    return ModuleDefinition(
      requireNotNull(name),
      constantsProvider,
      methods
    )
  }

  fun name(name: String) {
    this.name = name
  }

  fun constants(constantsProvider: () -> Map<String, Any?>) {
    this.constantsProvider = constantsProvider
  }

  inline fun <reified R : Any> method(
    name: String,
    crossinline body: () -> R
  ) {
    methods[name] = Method(name, arrayOf<TypeInformation<*>>()) { body() }
  }

  @JvmName("methodWithPromise")
  inline fun method(
    name: String,
    crossinline body: (p0: Promise) -> Unit
  ) {
    methods[name] = PromiseMethod(name, arrayOf()) { _, promise -> body(promise) }
  }

  inline fun <reified P0, reified R : Any> method(
    name: String,
    crossinline body: (p0: P0) -> R
  ): AnyMethod {
    val method = Method(name, arrayOf(TypeInformation(P0::class.java, null is P0))) { body(it[0] as P0) }
    methods[name] = method
    return method
  }

  @JvmName("methodWithPromise")
  inline fun <reified P0> method(
    name: String,
    crossinline body: (p0: P0, p1: Promise) -> Unit
  ) {
    methods[name] = PromiseMethod(name, arrayOf(TypeInformation(P0::class.java, null is P0))) { args, promise -> body(args[0] as P0, promise) }
  }

  inline fun <reified P0, reified P1, reified R : Any> method(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ) {
    methods[name] = Method(name, arrayOf(TypeInformation(P0::class.java, null is P0), TypeInformation(P1::class.java, null is P1))) { body(it[0] as P0, it[1] as P1) }
  }

  @JvmName("methodWithPromise")
  inline fun <reified P0, reified P1> method(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: Promise) -> Unit
  ) {
    methods[name] = PromiseMethod(name, arrayOf(TypeInformation(P0::class.java, null is P0), TypeInformation(P1::class.java, null is P1))) { args, promise -> body(args[0] as P0, args[1] as P1, promise) }
  }
}
