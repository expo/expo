@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import androidx.compose.runtime.Composable
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.functions.SuspendFunctionComponent
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.modules.InternalModuleDefinitionBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.descriptors.toTypeDescriptor
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import expo.modules.kotlin.types.toArgsArray
import expo.modules.kotlin.views.decorators.UseCSSProps
import kotlin.reflect.KClass
import kotlin.reflect.full.createInstance
import kotlin.reflect.full.memberProperties

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
    P::class.memberProperties.forEach { prop ->
      val kType = prop.returnType.arguments.first().type
      if (kType != null && viewDefinitionBuilder.props[prop.name] == null) {
        viewDefinitionBuilder.props[prop.name] = ComposeViewProp(prop.name, AnyType(kType.toTypeDescriptor()), prop)
      }
    }

    viewDefinitionBuilder.UseCSSProps()
    body.invoke(viewDefinitionBuilder)
    registerViewDefinition(viewDefinitionBuilder.build())
  }

  @JvmName("ComposeView")
  inline fun <reified Props : ComposeProps> View(
    name: String,
    events: ComposeViewEventDefinitionBuilder.() -> Unit = {},
    functions: ComposeViewFunctionDefinitionBuilder<Props>.() -> Unit = {},
    noinline viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
  ) {
    val eventBuilder = ComposeViewEventDefinitionBuilder()
    events.invoke(eventBuilder)
    val functionBuilder = ComposeViewFunctionDefinitionBuilder(name, Props::class, viewFunction, eventBuilder)
    functions.invoke(functionBuilder)
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
class ComposeViewFunctionDefinitionBuilder<Props : ComposeProps>(
  val name: String,
  val propsClass: KClass<Props>,
  val viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit,
  private val eventBuilder: ComposeViewEventDefinitionBuilder = ComposeViewEventDefinitionBuilder()
) {
  @PublishedApi
  internal val viewType = typeDescriptorOf<ComposeFunctionHolder<ComposeProps>>()

  @PublishedApi
  internal var deferredFunctions = mutableMapOf<String, SuspendFunctionComponent>()

  /**
   * Declares an async function whose implementation is provided by
   * [FunctionalComposableScope.AsyncFunctionHandler] inside the composable lambda.
   */
  fun AsyncFunction(name: String) {
    deferredFunctions[name] = SuspendFunctionComponent(
      name,
      arrayOf(AnyType(viewType))
    ) { args ->
      val view = args[0] as ComposeFunctionHolder<*>
      val handler = view.functionHandlers[name]
        ?: error("No AsyncFunctionHandler registered for '$name' in the composable")
      handler(emptyArray())
    }
  }

  @JvmName("AsyncFunctionWith1Arg")
  inline fun <reified P0> AsyncFunction(name: String) {
    deferredFunctionWithArgs(name, toArgsArray<ComposeFunctionHolder<ComposeProps>, P0>())
  }

  @JvmName("AsyncFunctionWith2Args")
  inline fun <reified P0, reified P1> AsyncFunction(name: String) {
    deferredFunctionWithArgs(name, toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1>())
  }

  @JvmName("AsyncFunctionWith3Args")
  inline fun <reified P0, reified P1, reified P2> AsyncFunction(name: String) {
    deferredFunctionWithArgs(name, toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2>())
  }

  @JvmName("AsyncFunctionWith4Args")
  inline fun <reified P0, reified P1, reified P2, reified P3> AsyncFunction(name: String) {
    deferredFunctionWithArgs(name, toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3>())
  }

  @JvmName("AsyncFunctionWith5Args")
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunction(name: String) {
    deferredFunctionWithArgs(name, toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3, P4>())
  }

  @JvmName("AsyncFunctionWith6Args")
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunction(name: String) {
    deferredFunctionWithArgs(name, toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3, P4, P5>())
  }

  @JvmName("AsyncFunctionWith7Args")
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunction(name: String) {
    deferredFunctionWithArgs(name, toArgsArray<ComposeFunctionHolder<ComposeProps>, P0, P1, P2, P3, P4, P5, P6>())
  }

  @PublishedApi
  internal fun deferredFunctionWithArgs(name: String, argsTypes: Array<AnyType>) {
    deferredFunctions[name] = SuspendFunctionComponent(name, argsTypes) { args ->
      val view = args[0] as ComposeFunctionHolder<*>
      val handler = view.functionHandlers[name]
        ?: error("No AsyncFunctionHandler registered for '$name' in the composable")
      handler(args.sliceArray(1 until args.size))
    }
  }

  fun build(): ViewManagerDefinition {
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
          propsClass.createInstance()
        } catch (e: Exception) {
          throw IllegalStateException("Could not instantiate props instance of $name compose component.", e)
        }
        ComposeFunctionHolder(context, appContext, name, viewFunction, instance)
      },
      callbacksDefinition = eventBuilder.callbacksDefinition,
      viewType = ComposeFunctionHolder::class.java,
      props = propsClass.memberProperties.associate { prop ->
        val kType = prop.returnType
        prop.name to ComposeViewProp(prop.name, AnyType(kType.toTypeDescriptor()), prop)
      },
      asyncFunctions = allFunctions.values.toList()
    )
  }
}
