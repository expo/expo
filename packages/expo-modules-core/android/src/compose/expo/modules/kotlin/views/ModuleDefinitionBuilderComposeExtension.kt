@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import androidx.compose.runtime.Composable
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.modules.InternalModuleDefinitionBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.LazyKType
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
    noinline viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
  ) {
    val definitionBuilder = ComposeViewFunctionDefinitionBuilder(name, Props::class, viewFunction)
    events.invoke(definitionBuilder)
    registerViewDefinition(definitionBuilder.build())
  }
}

@DefinitionMarker
class ComposeViewFunctionDefinitionBuilder<Props : ComposeProps>(
  val name: String,
  val propsClass: KClass<Props>,
  val viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
) {
  private var callbacksDefinition: CallbacksDefinition? = null

  fun build(): ViewManagerDefinition {
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
      }
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
}
