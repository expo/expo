@file:Suppress("FunctionName")

package expo.modules.kotlin.views.decorators

import com.facebook.react.uimanager.ViewProps
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.ViewDefinitionBuilder

inline fun <reified T : ExpoComposeView<*>> ViewDefinitionBuilder<T>.UseTestIDProp(crossinline body: (view: T, testID: String?) -> Unit) {
  Prop(ViewProps.TEST_ID) { view: T, testID: String? ->
    body(view, testID)
  }
}

private fun <T : ExpoComposeView<*>> ViewDefinitionBuilder<T>.UseTestIDProp() {
  enforceType<ViewDefinitionBuilder<ExpoComposeView<*>>>(this)
  UseTestIDProp { view, testID ->
    view.testID = testID
  }
}

/**
 * Decorates the view definition builder with common props.
 */
@PublishedApi
internal fun <T : ExpoComposeView<*>> ViewDefinitionBuilder<T>.UseCommonProps() {
  UseTestIDProp()
}
