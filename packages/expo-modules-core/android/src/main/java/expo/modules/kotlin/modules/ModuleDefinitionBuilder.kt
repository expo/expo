package expo.modules.kotlin.modules

import expo.modules.core.Promise
import expo.modules.kotlin.methods.AnyMethod
import expo.modules.kotlin.methods.Method
import expo.modules.kotlin.methods.PromiseMethod
import expo.modules.kotlin.methods.TypeInformation
import expo.modules.kotlin.views.ViewManagerDefinition
import expo.modules.kotlin.views.ViewManagerDefinitionBuilder

class ModuleDefinitionBuilder {
  private var name: String? = null
  private var constantsProvider = { emptyMap<String, Any?>() }
  @PublishedApi
  internal var methods = mutableMapOf<String, AnyMethod>()
  private var viewManagerDefinition: ViewManagerDefinition? = null

  fun build(): ModuleDefinition {
    return ModuleDefinition(
      requireNotNull(name),
      constantsProvider,
      methods,
      viewManagerDefinition
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
    methods[name] = Method(name, arrayOf()) { body() }
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

  fun viewManager(body: ViewManagerDefinitionBuilder.() -> Unit) {
    require(viewManagerDefinition == null) { "The module definition may have exported only one view manager." }

    val viewManagerDefinitionBuilder = ViewManagerDefinitionBuilder()
    body.invoke(viewManagerDefinitionBuilder)
    viewManagerDefinition = viewManagerDefinitionBuilder.build()
  }
}
