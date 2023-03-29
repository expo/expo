@file:Suppress("FunctionName")

package expo.modules.kotlin.modules

import android.app.Activity
import android.content.Intent
import android.view.View
import expo.modules.kotlin.activityresult.AppContextActivityResultCaller
import expo.modules.kotlin.classcomponent.ClassComponentBuilder
import expo.modules.kotlin.classcomponent.ClassDefinitionData
import expo.modules.kotlin.events.BasicEventListener
import expo.modules.kotlin.events.EventListener
import expo.modules.kotlin.events.EventListenerWithPayload
import expo.modules.kotlin.events.EventListenerWithSenderAndPayload
import expo.modules.kotlin.events.EventName
import expo.modules.kotlin.events.OnActivityResultPayload
import expo.modules.kotlin.objects.ObjectDefinitionBuilder
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.views.ViewDefinitionBuilder
import expo.modules.kotlin.views.ViewManagerDefinition
import kotlin.reflect.KClass
import kotlin.reflect.typeOf

@DefinitionMarker
class ModuleDefinitionBuilder(@PublishedApi internal val module: Module? = null) : ObjectDefinitionBuilder() {
  private var name: String? = null

  @PublishedApi
  internal var viewManagerDefinition: ViewManagerDefinition? = null

  @PublishedApi
  internal val eventListeners = mutableMapOf<EventName, EventListener>()

  @PublishedApi
  internal var registerContracts: (suspend AppContextActivityResultCaller.() -> Unit)? = null

  @PublishedApi
  internal var classData = mutableListOf<ClassDefinitionData>()

  fun buildModule(): ModuleDefinitionData {
    val moduleName = name ?: module?.javaClass?.simpleName

    return ModuleDefinitionData(
      requireNotNull(moduleName),
      buildObject(),
      viewManagerDefinition,
      eventListeners,
      registerContracts,
      classData
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
  inline fun <reified T : View> View(viewClass: KClass<T>, body: ViewDefinitionBuilder<T>.() -> Unit) {
    require(viewManagerDefinition == null) { "The module definition may have exported only one view manager." }

    val viewDefinitionBuilder = ViewDefinitionBuilder(viewClass, typeOf<T>())
    body.invoke(viewDefinitionBuilder)
    viewManagerDefinition = viewDefinitionBuilder.build()
  }

  /**
   * Creates module's lifecycle listener that is called right after the module initialization.
   */
  inline fun OnCreate(crossinline body: () -> Unit) {
    eventListeners[EventName.MODULE_CREATE] = BasicEventListener(EventName.MODULE_CREATE) { body() }
  }

  /**
   * Allows registration of activity contracts. It's run after `OnCreate` block.
   */
  fun RegisterActivityContracts(body: suspend AppContextActivityResultCaller.() -> Unit) {
    registerContracts = body
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

  inline fun Class(name: String, body: ClassComponentBuilder<Unit>.() -> Unit = {}) {
    val clazzBuilder = ClassComponentBuilder(name, Unit::class, typeOf<Unit>())
    body.invoke(clazzBuilder)
    classData.add(clazzBuilder.buildClass())
  }

  inline fun <reified SharedObjectType : SharedObject> Class(
    sharedObjectClass: KClass<SharedObjectType>,
    body: ClassComponentBuilder<SharedObjectType>.() -> Unit = {}
  ) {
    val clazzBuilder = ClassComponentBuilder(sharedObjectClass.java.simpleName, sharedObjectClass, typeOf<SharedObjectType>())
    body.invoke(clazzBuilder)
    classData.add(clazzBuilder.buildClass())
  }
}
