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

package expo.modules.kotlin.modules

import expo.modules.kotlin.Promise
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.EventsDefinition
import expo.modules.kotlin.methods.AnyMethod
import expo.modules.kotlin.methods.Method
import expo.modules.kotlin.methods.PromiseMethod
import expo.modules.kotlin.views.ViewManagerDefinition
import expo.modules.kotlin.views.ViewManagerDefinitionBuilder
import kotlin.reflect.typeOf

class ModuleDefinitionBuilder {
  private var name: String? = null
  private var constantsProvider = { emptyMap<String, Any?>() }
  private var eventsDefinition: EventsDefinition? = null

  @PublishedApi
  internal var methods = mutableMapOf<String, AnyMethod>()

  @PublishedApi
  internal var viewManagerDefinition: ViewManagerDefinition? = null

  @PublishedApi
  internal val eventListeners = mutableMapOf<EventName, EventListener>()

  fun build(): ModuleDefinition {
    return ModuleDefinition(
      requireNotNull(name),
      constantsProvider,
      methods,
      viewManagerDefinition,
      eventListeners,
      eventsDefinition
    )
  }

  fun name(name: String) {
    this.name = name
  }

  fun constants(constantsProvider: () -> Map<String, Any?>) {
    this.constantsProvider = constantsProvider
  }

  @JvmName("methodWithoutArgs")
  inline fun method(
    name: String,
    crossinline body: () -> Any?
  ) {
    methods[name] = Method(name, arrayOf()) { body() }
  }

  inline fun <reified R> method(
    name: String,
    crossinline body: () -> R
  ) {
    methods[name] = Method(name, arrayOf()) { body() }
  }

  inline fun <reified R, reified P0> method(
    name: String,
    crossinline body: (p0: P0) -> R
  ) {
    methods[name] = if (P0::class == Promise::class) {
      PromiseMethod(name, arrayOf()) { _, promise -> body(promise as P0) }
    } else {
      Method(name, arrayOf()) { body(it[0] as P0) }
    }
  }

  inline fun <reified R, reified P0, reified P1> method(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ) {
    methods[name] = if (P1::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      Method(name, arrayOf(typeOf<P0>(), typeOf<P1>())) { body(it[0] as P0, it[1] as P1) }
    }
  }

  inline fun viewManager(body: ViewManagerDefinitionBuilder.() -> Unit) {
    require(viewManagerDefinition == null) { "The module definition may have exported only one view manager." }

    val viewManagerDefinitionBuilder = ViewManagerDefinitionBuilder()
    body.invoke(viewManagerDefinitionBuilder)
    viewManagerDefinition = viewManagerDefinitionBuilder.build()
  }

  inline fun onCreate(crossinline body: () -> Unit) {
    eventListeners[EventName.MODULE_CREATE] = BasicEventListener(EventName.MODULE_CREATE) { body() }
  }

  inline fun onDestroy(crossinline body: () -> Unit) {
    eventListeners[EventName.MODULE_DESTROY] = BasicEventListener(EventName.MODULE_DESTROY) { body() }
  }

  inline fun onActivityEntersForeground(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_ENTERS_FOREGROUND] = BasicEventListener(EventName.ACTIVITY_ENTERS_FOREGROUND) { body() }
  }

  inline fun onActivityEntersBackground(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_ENTERS_BACKGROUND] = BasicEventListener(EventName.ACTIVITY_ENTERS_BACKGROUND) { body() }
  }

  inline fun onActivityDestroys(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_DESTROYS] = BasicEventListener(EventName.ACTIVITY_DESTROYS) { body() }
  }

  /**
   * Defines event names that this module can send to JavaScript.
   */
  fun events(vararg events: String) {
    eventsDefinition = EventsDefinition(events)
  }

  /**
   * Method that is invoked when the first event listener is added.
   */
  inline fun onStartObserving(crossinline body: () -> Unit) {
    method("startObserving", body)
  }

  /**
   * Method that is invoked when all event listeners are removed.
   */
  inline fun onStopObserving(crossinline body: () -> Unit) {
    method("stopObserving", body)
  }
}
