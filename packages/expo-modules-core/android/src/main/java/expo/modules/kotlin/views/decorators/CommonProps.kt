@file:Suppress("FunctionName")

package expo.modules.kotlin.views.decorators

import android.view.View
import com.facebook.react.uimanager.ViewProps
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.views.ViewDefinitionBuilder

inline fun <reified T : View> ViewDefinitionBuilder<T>.UseTestIDProp(crossinline body: (view: T, testID: String?) -> Unit) {
  Prop(ViewProps.TEST_ID) { view: T, testID: String? ->
    body(view, testID)
  }
}

private fun <T : View> ViewDefinitionBuilder<T>.UseTestIDProp() {
  enforceType<ViewDefinitionBuilder<View>>(this)
  UseTestIDProp { view, testID ->
    if (view is expo.modules.kotlin.views.ExpoComposeView<*>) {
      view.testID = testID
    }
  }
}


/**
 * Decorates the view definition builder with common props.
 */
@PublishedApi
internal fun <T : View> ViewDefinitionBuilder<T>.UseCommonProps() {
  UseTestIDProp()
}
