@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.component6
import expo.modules.kotlin.component7
import expo.modules.kotlin.component8
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.functions.AsyncFunctionComponent
import expo.modules.kotlin.functions.AsyncFunctionBuilder
import expo.modules.kotlin.functions.AsyncFunctionWithPromiseComponent
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.functions.createAsyncFunctionComponent
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.types.toAnyType
import expo.modules.kotlin.types.toArgsArray
import kotlin.reflect.KClass
import kotlin.reflect.KType

@DefinitionMarker
class ViewDefinitionBuilder<T : View>(
  @PublishedApi internal val viewClass: KClass<T>,
  @PublishedApi internal val viewType: KType
) {
  @PublishedApi
  internal var name = viewClass.simpleName

  @PublishedApi
  internal var props = mutableMapOf<String, AnyViewProp>()

  @PublishedApi
  internal var onViewDestroys: ((View) -> Unit)? = null

  @PublishedApi
  internal var onViewDidUpdateProps: ((View) -> Unit)? = null

  @PublishedApi
  internal var viewGroupDefinition: ViewGroupDefinition? = null
  private var callbacksDefinition: CallbacksDefinition? = null

  @PublishedApi
  internal var asyncFunctions = mutableMapOf<String, AsyncFunctionComponent>()

  private var functionBuilders = mutableMapOf<String, AsyncFunctionBuilder>()

  fun build(): ViewManagerDefinition {
    val asyncFunctions = asyncFunctions + functionBuilders.mapValues { (_, value) -> value.build() }
    asyncFunctions.forEach { (_, function) ->
      function.runOnQueue(Queues.MAIN)
      function.ownerType = viewType
      function.canTakeOwner = true
    }

    return ViewManagerDefinition(
      viewFactory = createViewFactory(),
      viewType = viewClass.java,
      props = props,
      name = name,
      onViewDestroys = onViewDestroys,
      callbacksDefinition = callbacksDefinition,
      viewGroupDefinition = viewGroupDefinition,
      onViewDidUpdateProps = onViewDidUpdateProps,
      asyncFunctions = asyncFunctions.values.toList()
    )
  }

  /**
   * Sets the name of the view that is exported to the JavaScript world.
   */
  fun Name(viewName: String) {
    name = viewName
  }

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
      toAnyType<PropType>(),
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
      toAnyType<PropType>(),
      body
    )
  }

  inline fun <reified ViewType : View, reified PropType, reified CustomValueType> PropGroup(
    vararg props: Pair<String, CustomValueType>,
    noinline body: (view: ViewType, value: CustomValueType, prop: PropType) -> Unit
  ) {
    for ((name, value) in props) {
      Prop<ViewType, PropType>(name) { view, prop -> body(view, value, prop) }
    }
  }

  inline fun <reified ViewType : View, reified PropType> PropGroup(
    vararg props: String,
    noinline body: (view: ViewType, value: Int, prop: PropType) -> Unit
  ) {
    props.forEachIndexed { index, name ->
      Prop<ViewType, PropType>(name) { view, prop -> body(view, index, prop) }
    }
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
    assert(viewClass == ParentType::class) { "Provided type and view type have to be the same." }
    require(viewGroupDefinition == null) { "The viewManager definition may have exported only one groupView definition." }

    val groupViewDefinitionBuilder = ViewGroupDefinitionBuilder<ParentType>()
    body.invoke(groupViewDefinitionBuilder)
    viewGroupDefinition = groupViewDefinitionBuilder.build()
  }

  @JvmName("AsyncFunctionWithoutArgs")
  inline fun AsyncFunction(
    name: String,
    crossinline body: () -> Any?
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R> AsyncFunction(
    name: String,
    crossinline body: () -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: (p0: P0) -> R
  ): AsyncFunctionComponent {
    // We can't split that function, because that introduces a ambiguity when creating DSL component without parameters.
    return if (P0::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, emptyArray()) { _, promise -> body(promise as P0) }
    } else {
      createAsyncFunctionComponent(name, toArgsArray<P0>()) { (p0) ->
        enforceType<P0>(p0)
        body(p0)
      }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1>()) { (p0, p1) ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: Promise) -> R
  ): AsyncFunctionComponent {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0>()) { (p0), promise ->
      enforceType<P0>(p0)
      body(p0, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2) ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: Promise) -> R
  ): AsyncFunctionComponent {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1>()) { (p0, p1), promise ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3) ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: Promise) -> R
  ): AsyncFunctionComponent {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2), promise ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4) ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: Promise) -> R
  ): AsyncFunctionComponent {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3), promise ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5) ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: Promise) -> R
  ): AsyncFunctionComponent {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4), promise ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: Promise) -> R
  ): AsyncFunctionComponent {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5), promise ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6, P7>()) { (p0, p1, p2, p3, p4, p5, p6, p7) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6, P7>(p0, p1, p2, p3, p4, p5, p6, p7)
      body(p0, p1, p2, p3, p4, p5, p6, p7)
    }.also {
      asyncFunctions[name] = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: Promise) -> R
  ): AsyncFunctionComponent {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6), promise ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6, promise)
    }.also {
      asyncFunctions[name] = it
    }
  }

  fun AsyncFunction(
    name: String
  ) = AsyncFunctionBuilder(name).also { functionBuilders[name] = it }

  private fun createViewFactory(): (Context, AppContext) -> View =
    viewFactory@{ context: Context, appContext: AppContext ->
      val fullConstructor = try {
        // Try to use constructor with two arguments
        viewClass.java.getConstructor(Context::class.java, AppContext::class.java)
      } catch (e: NoSuchMethodException) {
        null
      }

      fullConstructor?.let {
        return@viewFactory try {
          it.newInstance(context, appContext)
        } catch (e: Throwable) {
          handleFailureDuringViewCreation(context, appContext, e)
        }
      }

      val contextConstructor = try {
        // Try to use constructor that use Android's context
        viewClass.java.getConstructor(Context::class.java)
      } catch (e: NoSuchMethodException) {
        null
      }

      contextConstructor?.let {
        return@viewFactory try {
          it.newInstance(context)
        } catch (e: Throwable) {
          handleFailureDuringViewCreation(context, appContext, e)
        }
      }

      throw IllegalStateException("Didn't find a correct constructor for $viewClass")
    }

  private fun handleFailureDuringViewCreation(context: Context, appContext: AppContext, e: Throwable): View {
    Log.e("ExpoModulesCore", "Couldn't create view of type $viewClass", e)

    appContext.errorManager?.reportExceptionToLogBox(
      if (e is CodedException) {
        e
      } else {
        UnexpectedException(e)
      }
    )

    return if (ViewGroup::class.java.isAssignableFrom(viewClass.java)) {
      ErrorGroupView(context)
    } else {
      ErrorView(context)
    }
  }
}
