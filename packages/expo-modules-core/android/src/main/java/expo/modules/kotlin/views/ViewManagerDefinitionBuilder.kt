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
      requireNotNull(viewFactory),
      requireNotNull(viewType),
      props,
      onViewDestroys,
      callbacksDefinition,
      viewGroupDefinition
    )

  @Deprecated(
    message = "The 'view' component was renamed to 'View'.",
    replaceWith = ReplaceWith("View(body)")
  )
  inline fun <reified ViewType : View> view(noinline body: (Context) -> ViewType) = View(body)

  /**
   * Defines the factory creating a native view when the module is used as a view.
   */
  inline fun <reified ViewType : View> View(noinline body: (Context) -> ViewType) {
    viewType = ViewType::class.java
    viewFactory = body
  }

  @Deprecated(
    message = "The 'onViewDestroys' component was renamed to 'OnViewDestroys'.",
    replaceWith = ReplaceWith("OnViewDestroys(body)")
  )
  inline fun <reified ViewType : View> onViewDestroys(noinline body: (view: ViewType) -> Unit) = OnViewDestroys(body)

  /**
   * Creates view's lifecycle listener that is called right after the view isn't longer used by React Native.
   */
  inline fun <reified ViewType : View> OnViewDestroys(noinline body: (view: ViewType) -> Unit) {
    onViewDestroys = { body(it as ViewType) }
  }

  @Deprecated(
    message = "The 'prop' component was renamed to 'Prop'.",
    replaceWith = ReplaceWith("Prop(body)")
  )
  inline fun <reified ViewType : View, reified PropType> prop(
    name: String,
    noinline body: (view: ViewType, prop: PropType) -> Unit
  ) = Prop(name, body)

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

  @Deprecated(
    message = "The 'events' component was renamed to 'Events'.",
    replaceWith = ReplaceWith("Events(callbacks)")
  )
  fun events(vararg callbacks: String) = Events(*callbacks)

  /**
   * Defines prop names that should be treated as callbacks.
   */
  fun Events(vararg callbacks: String) {
    callbacksDefinition = CallbacksDefinition(callbacks)
  }

  @Deprecated(
    message = "The 'groupView' component was renamed to 'GroupView'.",
    replaceWith = ReplaceWith("GroupView(callbacks)")
  )
  inline fun groupView(body: ViewGroupDefinitionBuilder.() -> Unit) = GroupView(body)

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
