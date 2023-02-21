@file:OptIn(ExperimentalStdlibApi::class)
@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.KClass
import kotlin.reflect.KFunction
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.typeOf

@DefinitionMarker
class ViewDefinitionBuilder<T : View>(@PublishedApi internal val viewType: KClass<T>) {
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
  @Suppress("UNCHECKED_CAST")
  inline fun OnViewDestroys(crossinline body: (view: T) -> Unit) {
    onViewDestroys = {
      body(it as T)
    }
  }

  /**
   * Creates view's lifecycle listener that is called right after the view isn't longer used by React Native.
   */
  @JvmName("OnViewDestroysGeneric")
  inline fun <reified ViewType : T> OnViewDestroys(noinline body: (view: ViewType) -> Unit) {
    onViewDestroys = { body(it as ViewType) }
  }

  /**
   * Defines the view lifecycle method that is called when the view finished updating all props.
   */
  @Suppress("UNCHECKED_CAST")
  inline fun OnViewDidUpdateProps(crossinline body: (view: T) -> Unit) {
    onViewDidUpdateProps = {
      body(it as T)
    }
  }

  /**
   * Defines the view lifecycle method that is called when the view finished updating all props.
   */
  @JvmName("OnViewDidUpdatePropsGeneric")
  inline fun <reified ViewType : T> OnViewDidUpdateProps(noinline body: (view: ViewType) -> Unit) {
    onViewDidUpdateProps = { body(it as ViewType) }
  }

  /**
   * Creates a view prop that defines its name and setter.
   */
  inline fun <reified PropType> Prop(
    name: String,
    noinline body: (view: T, prop: PropType) -> Unit
  ) {
    props[name] = ConcreteViewProp(
      name,
      typeOf<PropType>().toAnyType(),
      body
    )
  }

  /**
   * Creates a view prop that defines its name and setter.
   */
  @JvmName("PropGeneric")
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
  inline fun <reified ParentType : ViewGroup> GroupView(body: ViewGroupDefinitionBuilder<ParentType>.() -> Unit) {
    assert(viewType == ParentType::class) { "Provided type and view type have to be the same." }
    require(viewGroupDefinition == null) { "The viewManager definition may have exported only one groupView definition." }

    val groupViewDefinitionBuilder = ViewGroupDefinitionBuilder<ParentType>()
    body.invoke(groupViewDefinitionBuilder)
    viewGroupDefinition = groupViewDefinitionBuilder.build()
  }

  private fun createViewFactory(): (Context, AppContext) -> View = viewFactory@{ context: Context, appContext: AppContext ->
    val primaryConstructor = requireNotNull(getPrimaryConstructor()) { "$viewType doesn't have a primary constructor" }
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
      return@viewFactory try {
        primaryConstructor.call(context)
      } catch (e: Throwable) {
        handleFailureDuringViewCreation(context, appContext, e)
      }
    }

    val secondArgType = args[1].type
    if (AppContext::class != secondArgType.classifier) {
      throw IllegalStateException("The type of the second constructor argument has to be `expo.modules.kotlin.AppContext`.")
    }

    if (args.size != 2) {
      throw IllegalStateException("Android view has more constructor arguments than expected.")
    }

    return@viewFactory try {
      primaryConstructor.call(context, appContext)
    } catch (e: Throwable) {
      handleFailureDuringViewCreation(context, appContext, e)
    }
  }

  private fun handleFailureDuringViewCreation(context: Context, appContext: AppContext, e: Throwable): View {
    Log.e("ExpoModulesCore", "Couldn't create view of type $viewType", e)

    appContext.errorManager?.reportExceptionToLogBox(
      if (e is CodedException) {
        e
      } else {
        UnexpectedException(e)
      }
    )
    return View(context)
  }

  private fun getPrimaryConstructor(): KFunction<T>? {
    val kotlinContractor = viewType.primaryConstructor
    if (kotlinContractor != null) {
      return kotlinContractor
    }

    // Add compatibility with Java
    return viewType.constructors.firstOrNull()
  }
}
