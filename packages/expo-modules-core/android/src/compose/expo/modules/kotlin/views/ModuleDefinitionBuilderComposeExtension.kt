@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import androidx.compose.runtime.Composable
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.functions.SuspendFunctionComponent
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.modules.InternalModuleDefinitionBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import expo.modules.kotlin.types.toArgsArray
import expo.modules.kotlin.viewevent.CoalescingKey
import expo.modules.kotlin.views.decorators.UseCSSProps
import kotlin.properties.PropertyDelegateProvider
import kotlin.reflect.KClass

/**
 * The name for the global event dispatcher
 */
internal const val GLOBAL_EVENT_NAME = "onGlobalEvent"

open class ModuleDefinitionBuilderWithCompose(
  module: Module? = null
) : InternalModuleDefinitionBuilder(module) {
  /**
   * Creates the view manager definition that scopes other view-related definitions.
   * Also collects all compose view props and generates setters.
   */
  @JvmName("ComposeView")
  inline fun <reified T : ExpoComposeView<P>, reified P : ComposeProps> View(viewClass: KClass<T>, body: ViewDefinitionBuilder<T>.() -> Unit = {}) {
    val viewDefinitionBuilder = ViewDefinitionBuilder(viewClass, typeDescriptorOf<T>())

    val propsParsingStrategy = toPropsParsingStrategy<P>()
    for (prop in propsParsingStrategy.unwrappedProps().values) {
      viewDefinitionBuilder.props[prop.name] = prop
    }

    viewDefinitionBuilder.UseCSSProps()
    body.invoke(viewDefinitionBuilder)
    registerViewDefinition(viewDefinitionBuilder.build())
  }

  /**
   * Registers a compose view definition. Events and async functions are
   * declared via `by Event<T>()` / `by AsyncFunction<T>()` property delegates
   * on the builder scope; the composable body is supplied via
   * `Content { props -> }`. Function/event names are derived from the
   * variable name, so declaring and handling use a single Kotlin identifier.
   */
  @JvmName("ComposeView")
  inline fun <reified Props : ComposeProps> View(
    name: String,
    block: ComposeViewBuilderScope<Props>.() -> Unit
  ) {
    val scope = ComposeViewBuilderScope(
      name,
      toPropsParsingStrategy<Props>()
    ).apply(block)
    registerViewDefinition(scope.build())
  }

  /**
   * Legacy overload kept for source compatibility. `events` is required (pass
   * `events = {}` if your view has no events) to disambiguate from the
   * builder-scope overload above. Migrate to `View<Props>(name) { ... }`.
   */
  @Deprecated(
    message = "Use the View<Props>(name) { ... Content { props -> ... } } builder-scope DSL. " +
      "Declare events via `val onX by Event<T>()`.",
    level = DeprecationLevel.WARNING
  )
  @JvmName("ComposeViewLegacy")
  inline fun <reified Props : ComposeProps> View(
    name: String,
    events: ComposeViewEventDefinitionBuilder.() -> Unit,
    noinline viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
  ) {
    val eventBuilder = ComposeViewEventDefinitionBuilder()
    events.invoke(eventBuilder)
    val functionBuilder = ComposeViewFunctionDefinitionBuilder(
      name,
      toPropsParsingStrategy<Props>(),
      viewFunction,
      eventBuilder
    )
    registerViewDefinition(functionBuilder.build())
  }
}

@DefinitionMarker
class ComposeViewEventDefinitionBuilder {
  internal var callbacksDefinition: CallbacksDefinition = CallbacksDefinition(arrayOf(GLOBAL_EVENT_NAME))

  /**
   * Defines prop names that should be treated as callbacks.
   */
  fun Events(vararg callbacks: String) {
    callbacksDefinition = CallbacksDefinition(
      arrayOf(GLOBAL_EVENT_NAME, *callbacks)
    )
  }

  /**
   * Defines prop names that should be treated as callbacks.
   */
  @JvmName("EventsWithArray")
  fun Events(callbacks: Array<String>) {
    callbacksDefinition = CallbacksDefinition(
      arrayOf(GLOBAL_EVENT_NAME, *callbacks)
    )
  }
}

@DefinitionMarker
class ComposeViewFunctionDefinitionBuilder<Props : ComposeProps> @PublishedApi internal constructor(
  val name: String,
  val propsParsingStrategy: PropsParsingStrategy<Props>,
  val viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit,
  private val eventBuilder: ComposeViewEventDefinitionBuilder = ComposeViewEventDefinitionBuilder()
) {
  @PublishedApi
  internal val viewType = typeDescriptorOf<ComposeFunctionHolder<ComposeProps>>()

  @PublishedApi
  internal var deferredFunctions = mutableMapOf<String, SuspendFunctionComponent>()

  @PublishedApi
  internal fun build(): ViewManagerDefinition {
    val allFunctions = deferredFunctions
    allFunctions.forEach { (_, function) ->
      function.runOnQueue(Queues.MAIN)
      function.ownerType = viewType
      function.canTakeOwner = true
    }

    return ViewManagerDefinition(
      name = name,
      viewFactory = { context, appContext ->
        val instance: Props = try {
          propsParsingStrategy.createNewInstance()
        } catch (e: Exception) {
          throw IllegalStateException("Could not instantiate props instance of $name compose component.", e)
        }
        ComposeFunctionHolder(context, appContext, name, viewFunction, instance)
      },
      callbacksDefinition = eventBuilder.callbacksDefinition,
      viewType = ComposeFunctionHolder::class.java,
      props = propsParsingStrategy.props(),
      asyncFunctions = allFunctions.values.toList()
    )
  }
}

/**
 * Receiver of the `View<Props>(name) { ... }` block. Collects events and
 * async function declarations (via `by Event<T>()` / `by AsyncFunction<T>()`
 * property delegates) and the composable body (`Content { props -> ... }`),
 * then hands them off to [ComposeViewFunctionDefinitionBuilder] at build time.
 *
 * Example:
 * ```
 * View<TextFieldProps>("TextFieldView") {
 *   val focus by AsyncFunction()
 *   val onValueChange by Event<String>()
 *
 *   Content { props ->
 *     focus.handle { focusRequester.requestFocus() }
 *     TextFieldContent(props, onValueChange = { onValueChange(it) })
 *   }
 * }
 * ```
 */
@DefinitionMarker
class ComposeViewBuilderScope<Props : ComposeProps> @PublishedApi internal constructor(
  @PublishedApi internal val name: String,
  @PublishedApi internal val propsParsingStrategy: PropsParsingStrategy<Props>
) {
  @PublishedApi
  internal val viewType = typeDescriptorOf<ComposeFunctionHolder<ComposeProps>>()

  @PublishedApi
  internal val eventNames = mutableListOf<String>()

  @PublishedApi
  internal val asyncFunctions = mutableMapOf<String, SuspendFunctionComponent>()

  @PublishedApi
  internal var contentLambda: (@Composable FunctionalComposableScope.(Props) -> Unit)? = null

  /**
   * Declares one or more event names (callback props) without creating a typed
   * [EventHandle]. Use this for callbacks whose dispatch site lives in a
   * sibling composable that already has a payload type via its own
   * `EventDispatcher<T>()`.
   */
  fun Events(vararg callbacks: String) {
    eventNames += callbacks
  }

  /**
   * Declares an event via property delegation. The event name is derived from
   * the `val` identifier. The returned [EventHandle] dispatches by invocation
   * inside the [Content] block, e.g. `onValueChange(payload)`.
   *
   * Usage: `val onValueChange by Event<String>()`
   */
  inline fun <reified T> Event(noinline coalescingKey: CoalescingKey<T>? = null): PropertyDelegateProvider<Any?, EventHandle<T>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.eventNames += property.name
      EventHandle(property.name, coalescingKey)
    }
  }

  /**
   * Declares a 0-arg async function via property delegation. The JS-visible
   * function name is taken from the `val` identifier. Bind the handler inside
   * [Content] with `handle.handle { ... }`.
   *
   * Usage: `val focus by AsyncFunction()`
   */
  fun AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle<Unit>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerNoArgAsyncFunction(property.name)
      AsyncFunctionHandle(property.name)
    }
  }

  @JvmName("AsyncFunctionWith1Arg")
  inline fun <reified P0> AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle<P0>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerAsyncFunctionWithArgs(
        property.name,
        toArgsArray<ComposeFunctionHolder<ComposeProps>, P0>()
      )
      AsyncFunctionHandle(property.name)
    }
  }

  @JvmName("AsyncFunctionWith2Args")
  inline fun <reified P0, reified P1> AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle2<P0, P1>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerAsyncFunctionWithArgs(
        property.name,
        toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1>()
      )
      AsyncFunctionHandle2(property.name)
    }
  }

  @JvmName("AsyncFunctionWith3Args")
  inline fun <reified P0, reified P1, reified P2> AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle3<P0, P1, P2>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerAsyncFunctionWithArgs(
        property.name,
        toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2>()
      )
      AsyncFunctionHandle3(property.name)
    }
  }

  @JvmName("AsyncFunctionWith4Args")
  inline fun <reified P0, reified P1, reified P2, reified P3> AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle4<P0, P1, P2, P3>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerAsyncFunctionWithArgs(
        property.name,
        toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3>()
      )
      AsyncFunctionHandle4(property.name)
    }
  }

  @JvmName("AsyncFunctionWith5Args")
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle5<P0, P1, P2, P3, P4>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerAsyncFunctionWithArgs(
        property.name,
        toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3, P4>()
      )
      AsyncFunctionHandle5(property.name)
    }
  }

  @JvmName("AsyncFunctionWith6Args")
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle6<P0, P1, P2, P3, P4, P5>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerAsyncFunctionWithArgs(
        property.name,
        toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3, P4, P5>()
      )
      AsyncFunctionHandle6(property.name)
    }
  }

  @JvmName("AsyncFunctionWith7Args")
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(): PropertyDelegateProvider<Any?, AsyncFunctionHandle7<P0, P1, P2, P3, P4, P5, P6>> {
    val scope = this
    return PropertyDelegateProvider { _, property ->
      scope.registerAsyncFunctionWithArgs(
        property.name,
        toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3, P4, P5, P6>()
      )
      AsyncFunctionHandle7(property.name)
    }
  }

  @PublishedApi
  internal fun registerNoArgAsyncFunction(fnName: String) {
    require(fnName !in asyncFunctions) {
      "AsyncFunction '$fnName' is already declared on view '$name'. Each function name must be unique within a view."
    }
    asyncFunctions[fnName] = SuspendFunctionComponent(
      fnName,
      arrayOf(AnyType(viewType))
    ) { args ->
      val view = args[0] as ComposeFunctionHolder<*>
      val handler = view.functionHandlers[fnName]
        ?: error("No handler registered for AsyncFunction '$fnName' on view '${view.name}'. Did you forget to bind it with `$fnName.handle { ... }` inside the Content { } block?")
      handler(emptyArray())
    }
  }

  @PublishedApi
  internal fun registerAsyncFunctionWithArgs(fnName: String, argsTypes: Array<AnyType>) {
    require(fnName !in asyncFunctions) {
      "AsyncFunction '$fnName' is already declared on view '$name'. Each function name must be unique within a view."
    }
    asyncFunctions[fnName] = SuspendFunctionComponent(fnName, argsTypes) { args ->
      val view = args[0] as ComposeFunctionHolder<*>
      val handler = view.functionHandlers[fnName]
        ?: error("No handler registered for AsyncFunction '$fnName' on view '${view.name}'. Did you forget to bind it with `$fnName.handle { ... }` inside the Content { } block?")
      handler(args.sliceArray(1 until args.size))
    }
  }

  /**
   * Sets the composable body for this view. Must be called exactly once.
   */
  fun Content(block: @Composable FunctionalComposableScope.(Props) -> Unit) {
    require(contentLambda == null) {
      "Content { } must be set exactly once for view '$name'."
    }
    contentLambda = block
  }

  @PublishedApi
  internal fun build(): ViewManagerDefinition {
    val content = requireNotNull(contentLambda) {
      "Content { } was not set for view '$name'. Add `Content { props -> ... }` inside the builder block."
    }
    val eventBuilder = ComposeViewEventDefinitionBuilder()
    if (eventNames.isNotEmpty()) {
      eventBuilder.Events(*eventNames.toTypedArray())
    }
    val functionBuilder = ComposeViewFunctionDefinitionBuilder(name, propsParsingStrategy, content, eventBuilder)
    asyncFunctions.forEach { (fnName, component) ->
      functionBuilder.deferredFunctions[fnName] = component
    }
    return functionBuilder.build()
  }
}
