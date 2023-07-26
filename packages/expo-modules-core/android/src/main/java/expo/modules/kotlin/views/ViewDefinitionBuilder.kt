@file:OptIn(ExperimentalStdlibApi::class)
@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.functions.AsyncFunction
import expo.modules.kotlin.functions.AsyncFunctionBuilder
import expo.modules.kotlin.functions.AsyncFunctionComponent
import expo.modules.kotlin.functions.AsyncFunctionWithPromiseComponent
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.KClass
import kotlin.reflect.KFunction
import kotlin.reflect.KType
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.typeOf

@DefinitionMarker
class ViewDefinitionBuilder<T : View>(
  @PublishedApi internal val viewClass: KClass<T>,
  @PublishedApi internal val viewType: KType
) {
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
  internal var asyncFunctions = mutableMapOf<String, AsyncFunction>()

  private var functionBuilders = mutableMapOf<String, AsyncFunctionBuilder>()

  fun build(): ViewManagerDefinition {
    val asyncFunctions = asyncFunctions + functionBuilders.mapValues { (_, value) -> value.build() }
    asyncFunctions.forEach { (_, function) ->
      function.runOnQueue(Queues.MAIN)
      function.ownerType = viewType
    }

    return ViewManagerDefinition(
      viewFactory = createViewFactory(),
      viewType = viewClass.java,
      props = props,
      onViewDestroys = onViewDestroys,
      callbacksDefinition = callbacksDefinition,
      viewGroupDefinition = viewGroupDefinition,
      onViewDidUpdateProps = onViewDidUpdateProps,
      asyncFunctions = asyncFunctions.values.toList(),
    )
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
      { typeOf<PropType>() }.toAnyType<PropType>(),
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
      { typeOf<PropType>() }.toAnyType<PropType>(),
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
  ): AsyncFunction {
    return AsyncFunctionComponent(name, arrayOf()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R> AsyncFunction(
    name: String,
    crossinline body: () -> R
  ): AsyncFunction {
    return AsyncFunctionComponent(name, arrayOf()) { body() }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: (p0: P0) -> R
  ): AsyncFunction {
    return if (P0::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf()) { _, promise -> body(promise as P0) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>())) { body(it[0] as P0) }
    }.also {
      it.ownerType = viewType
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): AsyncFunction {
    return if (P1::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>())) { body(it[0] as P0, it[1] as P1) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): AsyncFunction {
    return if (P2::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>())) { args, promise -> body(args[0] as P0, args[1] as P1, promise as P2) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): AsyncFunction {
    return if (P3::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, promise as P3) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): AsyncFunction {
    return if (P4::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, promise as P4) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): AsyncFunction {
    return if (P5::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, promise as P5) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): AsyncFunction {
    return if (P6::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, promise as P6) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunction(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): AsyncFunction {
    return if (P7::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6, promise as P7) }
    } else {
      AsyncFunctionComponent(name, arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>(), { typeOf<P7>() }.toAnyType<P7>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
    }.also {
      asyncFunctions[name] = it
    }
  }

  fun AsyncFunction(
    name: String
  ) = AsyncFunctionBuilder(name).also { functionBuilders[name] = it }

  private fun createViewFactory(): (Context, AppContext) -> View = viewFactory@{ context: Context, appContext: AppContext ->
    val primaryConstructor = requireNotNull(getPrimaryConstructor()) { "$viewClass doesn't have a primary constructor" }
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

  private fun getPrimaryConstructor(): KFunction<T>? {
    val kotlinContractor = viewClass.primaryConstructor
    if (kotlinContractor != null) {
      return kotlinContractor
    }

    // Add compatibility with Java
    return viewClass.constructors.firstOrNull()
  }
}
