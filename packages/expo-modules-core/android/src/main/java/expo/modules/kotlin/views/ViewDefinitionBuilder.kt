@file:OptIn(ExperimentalStdlibApi::class)
@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.KClass
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.typeOf

@DefinitionMarker
class ViewDefinitionBuilder<T : View>(private val viewType: KClass<T>) {
  @PublishedApi
  internal var props = mutableMapOf<String, AnyViewProp>()

  @PublishedApi
  internal var onViewDestroys: ((View) -> Unit)? = null

  @PublishedApi
  internal var onViewDidUpdateProps: ((View) -> Unit)? = null

  @PublishedApi
  internal var viewGroupDefinition: ViewGroupDefinition? = null
  private var callbacksDefinition: CallbacksDefinition? = null

  fun build(): ViewManagerDefinition =
    ViewManagerDefinition(
      viewFactory = createViewFactory(),
      viewType = viewType.java,
      props = props,
      onViewDestroys = onViewDestroys,
      callbacksDefinition = callbacksDefinition,
      viewGroupDefinition = viewGroupDefinition,
      onViewDidUpdateProps = onViewDidUpdateProps
    )

  /**
   * Creates view's lifecycle listener that is called right after the view isn't longer used by React Native.
   */
  inline fun <reified ViewType : View> OnViewDestroys(noinline body: (view: ViewType) -> Unit) {
    onViewDestroys = { body(it as ViewType) }
  }

  /**
   * Defines the view lifecycle method that is called when the view finished updating all props.
   */
  inline fun <reified ViewType : View> OnViewDidUpdateProps(noinline body: (view: ViewType) -> Unit) {
    onViewDidUpdateProps = { body(it as ViewType) }
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
   * Defines prop names that should be treated as callbacks.
   */
  fun Events(vararg callbacks: String) {
    callbacksDefinition = CallbacksDefinition(callbacks)
  }

  /**
   * Defines prop names that should be treated as callbacks.
   */
  @JvmName("EventsWithArray")
  fun Events(callbacks: Array<String>) {
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

  private fun createViewFactory(): (Context, AppContext) -> View = viewFactory@{ context: Context, appContext: AppContext ->
    val primaryConstructor = requireNotNull(viewType.primaryConstructor) { "$viewType doesn't have a primary constructor" }
    val args = primaryConstructor.parameters

    if (args.isEmpty()) {
      throw IllegalStateException("Android view has to have a constructor with at least one argument.")
    }

    val firstArgType = args.first().type
    if (Context::class != firstArgType.classifier) {
      throw IllegalStateException("The type of the first constructor argument has to be `android.content.Context`.")
    }

    // Backward compatibility
    if (args.size == 1) {
      return@viewFactory primaryConstructor.call(context)
    }

    val secondArgType = args[1].type
    if (AppContext::class != secondArgType.classifier) {
      throw IllegalStateException("The type of the second constructor argument has to be `expo.modules.kotlin.AppContext`.")
    }

    if (args.size != 2) {
      throw IllegalStateException("Android view has more constructor arguments than expected.")
    }

    return@viewFactory primaryConstructor.call(context, appContext)
  }
}
