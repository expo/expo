@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import androidx.compose.runtime.Composable
import expo.modules.kotlin.functions.AsyncFunctionComponent
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.functions.createAsyncFunctionComponent
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.modules.InternalModuleDefinitionBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.LazyKType
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.types.toArgsArray
import expo.modules.kotlin.views.decorators.UseCSSProps
import kotlin.reflect.KClass
import kotlin.reflect.full.createInstance
import kotlin.reflect.full.memberProperties
import kotlin.reflect.typeOf

open class ModuleDefinitionBuilderWithCompose(
  module: Module? = null
) : InternalModuleDefinitionBuilder(module) {
  /**
   * Creates the view manager definition that scopes other view-related definitions.
   * Also collects all compose view props and generates setters.
   */
  @JvmName("ComposeView")
  inline fun <reified T : ExpoComposeView<P>, reified P : Any> View(viewClass: KClass<T>, body: ViewDefinitionBuilder<T>.() -> Unit = {}) {
    val viewDefinitionBuilder = ViewDefinitionBuilder(viewClass, LazyKType(classifier = T::class, kTypeProvider = { typeOf<T>() }))
    P::class.memberProperties.forEach { prop ->
      val kType = prop.returnType.arguments.first().type
      if (kType != null && viewDefinitionBuilder.props[prop.name] == null) {
        viewDefinitionBuilder.props[prop.name] = ComposeViewProp(prop.name, AnyType(kType), prop)
      }
    }

    viewDefinitionBuilder.UseCSSProps()
    body.invoke(viewDefinitionBuilder)
    registerViewDefinition(viewDefinitionBuilder.build())
  }

  @JvmName("ComposeView")
  inline fun <reified Props : ComposeProps> View(
    name: String,
    events: ComposeViewFunctionDefinitionBuilder<Props>.() -> Unit = {},
    functions: ComposeViewFunctionDefinitionBuilder<Props>.() -> Unit = {},
    noinline viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
  ) {
    val definitionBuilder = ComposeViewFunctionDefinitionBuilder(name, Props::class, viewFunction)
    events.invoke(definitionBuilder)
    functions.invoke(definitionBuilder)
    registerViewDefinition(definitionBuilder.build())
  }
}

@DefinitionMarker
class ComposeViewFunctionDefinitionBuilder<Props : ComposeProps>(
  val name: String,
  @PublishedApi internal val propsClass: KClass<Props>,
  val viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
) {
  private var callbacksDefinition: CallbacksDefinition? = null

  @PublishedApi
  internal var asyncFunctions = mutableMapOf<String, AsyncFunctionComponent>()

  fun build(): ViewManagerDefinition {
    val viewType = LazyKType(classifier = ComposeFunctionHolder::class, kTypeProvider = { typeOf<ComposeFunctionHolder<Props>>() })

    asyncFunctions.forEach { (_, function) ->
      function.runOnQueue(Queues.MAIN)
      function.ownerType = viewType
      function.canTakeOwner = true
    }

    return ViewManagerDefinition(
      name = name,
      viewFactory = { context, appContext ->
        val instance: Props = try {
          propsClass.createInstance()
        } catch (e: Exception) {
          throw IllegalStateException("Could not instantiate props instance of $name compose component.", e)
        }
        ComposeFunctionHolder(context, appContext, name, viewFunction, instance)
      },
      callbacksDefinition = callbacksDefinition,
      viewType = ComposeFunctionHolder::class.java,
      props = propsClass.memberProperties.associate { prop ->
        val kType = prop.returnType
        prop.name to ComposeViewProp(prop.name, AnyType(kType), prop)
      },
      asyncFunctions = asyncFunctions.values.toList()
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
   * Creates an async function with a receiver scope that provides access to `callImperativeHandler`.
   * Use `callImperativeHandler` to call the handler registered by the composable via `ImperativeHandler`.
   *
   * Usage in functions block:
   * ```
   * AsyncFunction("setText") { text: String ->
   *   callImperativeHandler(text)
   * }
   * ```
   *
   * Usage in composable:
   * ```
   * ImperativeHandler("setText") { text: String ->
   *   textState.value = text
   * }
   * ```
   */
  inline fun <reified R> AsyncFunction(
    name: String,
    crossinline body: AsyncFunctionScope<Props>.() -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<ComposeFunctionHolder<Props>>()) { (view) ->
      enforceType<ComposeFunctionHolder<Props>>(view)
      AsyncFunctionScope(view, name).body()
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0> AsyncFunction(
    name: String,
    crossinline body: AsyncFunctionScope<Props>.(p0: P0) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<ComposeFunctionHolder<Props>, P0>()) { (view, p0) ->
      enforceType<ComposeFunctionHolder<Props>, P0>(view, p0)
      AsyncFunctionScope(view, name).body(p0)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncFunction(
    name: String,
    crossinline body: AsyncFunctionScope<Props>.(p0: P0, p1: P1) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<ComposeFunctionHolder<Props>, P0, P1>()) { (view, p0, p1) ->
      enforceType<ComposeFunctionHolder<Props>, P0, P1>(view, p0, p1)
      AsyncFunctionScope(view, name).body(p0, p1)
    }.also {
      asyncFunctions[name] = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncFunction(
    name: String,
    crossinline body: AsyncFunctionScope<Props>.(p0: P0, p1: P1, p2: P2) -> R
  ): AsyncFunctionComponent {
    return createAsyncFunctionComponent(name, toArgsArray<ComposeFunctionHolder<Props>, P0, P1, P2>()) { (view, p0, p1, p2) ->
      enforceType<ComposeFunctionHolder<Props>, P0, P1, P2>(view, p0, p1, p2)
      AsyncFunctionScope(view, name).body(p0, p1, p2)
    }.also {
      asyncFunctions[name] = it
    }
  }
}
