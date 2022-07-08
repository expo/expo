@file:Suppress("FunctionName")

package expo.modules.kotlin.modules

import android.app.Activity
import android.content.Intent
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.OnActivityResultPayload
import expo.modules.kotlin.objects.ObjectDefinitionBuilder
import expo.modules.kotlin.views.ViewManagerDefinition
import expo.modules.kotlin.views.ViewManagerDefinitionBuilder

@DefinitionMarker
class ModuleDefinitionBuilder(@PublishedApi internal val module: Module? = null) : ObjectDefinitionBuilder() {
  private var name: String? = null

  @PublishedApi
  internal var viewManagerDefinition: ViewManagerDefinition? = null

  @PublishedApi
  internal val eventListeners = mutableMapOf<EventName, EventListener>()

  fun buildModule(): ModuleDefinitionData {
    val moduleName = name ?: module?.javaClass?.simpleName

    return ModuleDefinitionData(
      requireNotNull(moduleName),
      buildObject(),
      viewManagerDefinition,
      eventListeners
    )
  }

  /**
   * Sets the name of the module that is exported to the JavaScript world.
   */
  fun Name(name: String) {
    this.name = name
  }

  /**
   * Creates the view manager definition that scopes other view-related definitions.
   */
  inline fun ViewManager(body: ViewManagerDefinitionBuilder.() -> Unit) {
    require(viewManagerDefinition == null) { "The module definition may have exported only one view manager." }

    val viewManagerDefinitionBuilder = ViewManagerDefinitionBuilder()
    body.invoke(viewManagerDefinitionBuilder)
    viewManagerDefinition = viewManagerDefinitionBuilder.build()
  }

  /**
   * Creates module's lifecycle listener that is called right after the module initialization.
   */
  inline fun OnCreate(crossinline body: () -> Unit) {
    eventListeners[EventName.MODULE_CREATE] = BasicEventListener(EventName.MODULE_CREATE) { body() }
  }

  /**
   * Creates module's lifecycle listener that is called when the module is about to be deallocated.
   */
  inline fun OnDestroy(crossinline body: () -> Unit) {
    eventListeners[EventName.MODULE_DESTROY] = BasicEventListener(EventName.MODULE_DESTROY) { body() }
  }

  /**
   * Creates module's lifecycle listener that is called right after the activity is resumed.
   */
  inline fun OnActivityEntersForeground(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_ENTERS_FOREGROUND] = BasicEventListener(EventName.ACTIVITY_ENTERS_FOREGROUND) { body() }
  }

  /**
   * Creates module's lifecycle listener that is called right after the activity is paused.
   */
  inline fun OnActivityEntersBackground(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_ENTERS_BACKGROUND] = BasicEventListener(EventName.ACTIVITY_ENTERS_BACKGROUND) { body() }
  }

  /**
   * Creates module's lifecycle listener that is called right after the activity is destroyed.
   */
  inline fun OnActivityDestroys(crossinline body: () -> Unit) {
    eventListeners[EventName.ACTIVITY_DESTROYS] = BasicEventListener(EventName.ACTIVITY_DESTROYS) { body() }
  }

  /**
   * Creates module's lifecycle listener that is called right after the new intent was received.
   */
  inline fun OnNewIntent(crossinline body: (Intent) -> Unit) {
    eventListeners[EventName.ON_NEW_INTENT] = EventListenerWithPayload<Intent>(EventName.ON_NEW_INTENT) { body(it) }
  }

  /**
   * Creates module's lifecycle listener that is called right after the activity has received a result.
   */
  inline fun OnActivityResult(crossinline body: (Activity, OnActivityResultPayload) -> Unit) {
    eventListeners[EventName.ON_ACTIVITY_RESULT] =
      EventListenerWithSenderAndPayload<Activity, OnActivityResultPayload>(EventName.ON_ACTIVITY_RESULT) { sender, payload -> body(sender, payload) }
  }
}
