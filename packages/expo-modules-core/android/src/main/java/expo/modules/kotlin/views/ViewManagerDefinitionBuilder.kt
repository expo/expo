@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

class ViewManagerDefinitionBuilder {
  @PublishedApi
  internal var viewFactory: ((Context) -> View)? = null
  @PublishedApi
  internal var viewType: Class<out View>? = null
  @PublishedApi
  internal var props = mutableMapOf<String, AnyViewProp>()

  fun build(): ViewManagerDefinition =
    ViewManagerDefinition(
      requireNotNull(viewFactory),
      requireNotNull(viewType),
      props
    )

  inline fun <reified ViewType : View> view(noinline body: (Context) -> ViewType) {
    viewType = ViewType::class.java
    viewFactory = body
  }

  inline fun <reified ViewType : View, reified PropType> prop(
    name: String,
    noinline body: (view: ViewType, prop: PropType) -> Unit
  ) {
    props[name] = ConcreteViewProp(
      name,
      typeOf<PropType>().toAnyType(),
      body
    )
  }
}
