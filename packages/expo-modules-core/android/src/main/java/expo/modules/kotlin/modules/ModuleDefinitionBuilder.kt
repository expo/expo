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
import expo.modules.kotlin.methods.AnyMethod
import expo.modules.kotlin.methods.Method
import expo.modules.kotlin.methods.PromiseMethod
import expo.modules.kotlin.types.toAnyType
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

  fun build(): ModuleDefinitionData {
    return ModuleDefinitionData(
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
  inline fun function(
    name: String,
    crossinline body: () -> Any?
  ) {
    methods[name] = Method(name, arrayOf()) { body() }
  }

  inline fun <reified R> function(
    name: String,
    crossinline body: () -> R
  ) {
    methods[name] = Method(name, arrayOf()) { body() }
  }

  inline fun <reified R, reified P0> function(
    name: String,
    crossinline body: (p0: P0) -> R
  ) {
    methods[name] = if (P0::class == Promise::class) {
      PromiseMethod(name, arrayOf()) { _, promise -> body(promise as P0) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType())) { body(it[0] as P0) }
    }
  }

  inline fun <reified R, reified P0, reified P1> function(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ) {
    methods[name] = if (P1::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>().toAnyType())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { body(it[0] as P0, it[1] as P1) }
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ) {
    methods[name] = if (P2::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, promise as P2) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ) {
    methods[name] = if (P3::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, promise as P3) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ) {
    methods[name] = if (P4::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, promise as P4) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ) {
    methods[name] = if (P5::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, promise as P5) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ) {
    methods[name] = if (P6::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, promise as P6) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> function(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ) {
    methods[name] = if (P7::class == Promise::class) {
      PromiseMethod(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6, promise as P7) }
    } else {
      Method(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType(), typeOf<P7>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
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
    function("startObserving", body)
  }

  /**
   * Method that is invoked when all event listeners are removed.
   */
  inline fun onStopObserving(crossinline body: () -> Unit) {
    function("stopObserving", body)
  }

  inline fun onNewIntent(crossinline body: (Intent) -> Unit) {
    eventListeners[EventName.ON_NEW_INTENT] = EventListenerWithPayload<Intent>(EventName.ON_NEW_INTENT) { body(it) }
  }

  inline fun onActivityResult(crossinline body: (Activity, OnActivityResultPayload) -> Unit) {
    eventListeners[EventName.ON_ACTIVITY_RESULT] =
      EventListenerWithSenderAndPayload<Activity, OnActivityResultPayload>(EventName.ON_ACTIVITY_RESULT) { sender, payload -> body(sender, payload) }
  }
}
