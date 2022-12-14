@file:OptIn(ExperimentalStdlibApi::class)
@file:Suppress("FunctionName")

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

  @PublishedApi
  internal var viewGroupDefinition: ViewGroupDefinition? = null
  private var callbacksDefinition: CallbacksDefinition? = null

  fun build(): ViewManagerDefinition =
    ViewManagerDefinition(
      { context, _ -> requireNotNull(viewFactory)(context) },
      requireNotNull(viewType),
      props,
      onViewDestroys,
      callbacksDefinition,
      viewGroupDefinition
    )

  /**
   * Defines the factory creating a native view when the module is used as a view.
   */
  inline fun <reified ViewType : View> View(noinline body: (Context) -> ViewType) {
    viewType = ViewType::class.java
    viewFactory = body
  }

  /**
   * Creates view's lifecycle listener that is called right after the view isn't longer used by React Native.
   */
  inline fun <reified ViewType : View> OnViewDestroys(noinline body: (view: ViewType) -> Unit) {
    onViewDestroys = { body(it as ViewType) }
  }

  /**
   * Creates a view prop that defines its name and setter.
   */
  inline fun <reified ViewType : View, reified PropType> Prop(
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
   * Creates a view prop group that defines its name and setter.
   */
  inline fun <reified ViewType : View, reified PropType> PropGroup(
    vararg names: String,
    noinline body: (view: ViewType, name: String, prop: PropType) -> Unit
  ) {
    for (name in names) {
      props[name] = ConcreteViewProp<ViewType, PropType>(
        name,
        typeOf<PropType>().toAnyType()
      ) { view, prop -> body(view, name, prop) }
    }
  }

  /**
   * Creates a view prop group that defines its name and setter with the custom mapping.
   */
  inline fun <reified ViewType : View, reified PropType, reified CustomValue> PropGroup(
    vararg propInfo: Pair<String, CustomValue>,
    noinline body: (view: ViewType, value: CustomValue, prop: PropType) -> Unit
  ) {
    for ((name, value) in propInfo) {
      props[name] = ConcreteViewProp<ViewType, PropType>(
        name,
        typeOf<PropType>().toAnyType()
      ) { view, prop -> body(view, value, prop) }
    }
  }

  /**
   * Creates a view prop group that defines its name and setter with the index mapping.
   */
  @JvmName("PropGroupIndexed")
  inline fun <reified ViewType : View, reified PropType> PropGroup(
    vararg names: String,
    noinline body: (view: ViewType, value: Int, prop: PropType) -> Unit
  ) {
    names.forEachIndexed { index, name ->
      props[name] = ConcreteViewProp<ViewType, PropType>(
        name,
        typeOf<PropType>().toAnyType()
      ) { view, prop -> body(view, index, prop) }
    }
  }

  /**
   * Defines prop names that should be treated as callbacks.
   */
  fun Events(vararg callbacks: String) {
    callbacksDefinition = CallbacksDefinition(callbacks)
  }

  /**
   * Creates the group view definition that scopes group view-related definitions.
   */
  inline fun GroupView(body: ViewGroupDefinitionBuilder.() -> Unit) {
    require(viewGroupDefinition == null) { "The viewManager definition may have exported only one groupView definition." }

    val groupViewDefinitionBuilder = ViewGroupDefinitionBuilder()
    body.invoke(groupViewDefinitionBuilder)
    viewGroupDefinition = groupViewDefinitionBuilder.build()
  }
}
