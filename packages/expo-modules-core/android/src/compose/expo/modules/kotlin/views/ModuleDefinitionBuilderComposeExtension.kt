@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import androidx.compose.runtime.Composable
import expo.modules.kotlin.modules.DefinitionMarker
import expo.modules.kotlin.modules.InternalModuleDefinitionBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.LazyKType
import expo.modules.kotlin.viewevent.ViewEvent
import expo.modules.kotlin.views.decorators.UseCSSProps
import kotlin.reflect.KClass
import kotlin.reflect.KProperty1
import kotlin.reflect.full.createInstance
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.isAccessible
import kotlin.reflect.typeOf

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
    noinline viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
  ) {
    val definitionBuilder = ComposeViewFunctionDefinitionBuilder(name, Props::class, viewFunction)
    registerViewDefinition(definitionBuilder.build())
  }
}

@DefinitionMarker
class ComposeViewFunctionDefinitionBuilder<Props : ComposeProps>(
  val name: String,
  val propsClass: KClass<Props>,
  val viewFunction: @Composable FunctionalComposableScope.(props: Props) -> Unit
) {
  fun build(): ViewManagerDefinition {
    val allProperties = propsClass.memberProperties
    val (eventProperties, regularProperties) = allProperties.partition { prop ->
      prop.returnType.classifier == ComposeEventDispatcher::class
    }

    val eventNames = eventProperties.map { it.name }.toTypedArray()
    val callbacksDefinition = CallbacksDefinition(arrayOf(GLOBAL_EVENT_NAME, *eventNames))

    return ViewManagerDefinition(
      name = name,
      viewFactory = { context, appContext ->
        val instance: Props = try {
          propsClass.createInstance()
        } catch (e: Exception) {
          throw IllegalStateException("Could not instantiate props instance of $name compose component.", e)
        }
        val holder = ComposeFunctionHolder(context, appContext, name, viewFunction, instance)

        // Wire each ComposeEventDispatcher to a ViewEvent that emits through React Native
        for (eventProp in eventProperties) {
          @Suppress("UNCHECKED_CAST")
          val property = eventProp as KProperty1<Props, ComposeEventDispatcher<Any?>>
          property.isAccessible = true
          val dispatcher = property.get(instance)
          dispatcher.callback = { arg -> ViewEvent(eventProp.name, holder, null).invoke(arg) }
        }

        holder
      },
      callbacksDefinition = callbacksDefinition,
      viewType = ComposeFunctionHolder::class.java,
      // Only register regular (non-event) properties as props
      props = regularProperties.associate { prop ->
        val kType = prop.returnType
        prop.name to ComposeViewProp(prop.name, AnyType(kType), prop)
      }
    )
  }
}
