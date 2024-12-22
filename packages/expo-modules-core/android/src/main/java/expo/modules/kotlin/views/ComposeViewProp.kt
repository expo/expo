package expo.modules.kotlin.views

import android.view.View
import androidx.compose.runtime.MutableState
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.PropSetException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.types.AnyType
import kotlin.reflect.full.memberProperties

class ComposeViewProp(
  name: String,
  anyType: AnyType
) : AnyViewProp(name, anyType) {

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View, appContext: AppContext?) {
    exceptionDecorator({
      PropSetException(name, onView::class, it)
    }) {
      val props = (onView as ExpoComposeView).props ?: return
      val property = props::class.memberProperties.find { it.name == name }?.getter?.call(onView.props)
      if (property is MutableState<*>) {
        (property as MutableState<Any?>).value = type.convert(prop, appContext)
      }
    }
  }

  override val isNullable: Boolean = anyType.kType.isMarkedNullable
}
