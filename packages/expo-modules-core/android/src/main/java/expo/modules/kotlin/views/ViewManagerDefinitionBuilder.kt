@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

@DefinitionMarker
class ViewManagerDefinitionBuilder {
  @PublishedApi
  internal var viewFactory: ((Context) -> View)? = null
  @PublishedApi
  internal var viewType: Class<out View>? = null
  @PublishedApi
  internal var props = mutableMapOf<String, AnyViewProp>()
  @PublishedApi
  internal var onViewDestroys: ((View) -> Unit)? = null

  private var callbacksDefinition: CallbacksDefinition? = null

  fun build(): ViewManagerDefinition =
    ViewManagerDefinition(
      requireNotNull(viewFactory),
      requireNotNull(viewType),
      props,
      onViewDestroys,
      callbacksDefinition
    )

  /**
   * Defines the factory creating a native view when the module is used as a view.
   */
  inline fun <reified ViewType : View> view(noinline body: (Context) -> ViewType) {
    viewType = ViewType::class.java
    viewFactory = body
  }

  /**
   * Creates view's lifecycle listener that is called right after the view isn't longer used by React Native.
   */
  inline fun <reified ViewType : View> onViewDestroys(noinline body: (view: ViewType) -> Unit) {
    onViewDestroys = { body(it as ViewType) }
  }

  /**
   * Creates a view prop that defines its name and setter.
   */
  inline fun <reified ViewType : View, reified PropType> prop(
    name: String,
    noinline body: (view: ViewType, prop: PropType) -> Unit
  ) {
    props[name] = ConcreteViewProp(
      name,
      typeOf<PropType>().toAnyType(),
      body
    )
  }

  /**
   * Defines prop names that should be treated as callbacks.
   */
  fun events(vararg callbacks: String) {
    callbacksDefinition = CallbacksDefinition(callbacks)
  }
}
