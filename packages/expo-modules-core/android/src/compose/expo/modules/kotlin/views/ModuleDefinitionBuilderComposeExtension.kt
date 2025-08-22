@file:Suppress("FunctionName")

package expo.modules.kotlin.views

import expo.modules.kotlin.modules.InternalModuleDefinitionBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.LazyKType
import expo.modules.kotlin.views.decorators.UseCommonProps
import expo.modules.kotlin.views.decorators.UseCSSProps
import kotlin.reflect.KClass
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

    viewDefinitionBuilder.UseCommonProps()
    viewDefinitionBuilder.UseCSSProps()
    body.invoke(viewDefinitionBuilder)
    registerViewDefinition(viewDefinitionBuilder.build())
  }
}
