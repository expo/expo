package expo.modules.kotlin.views

import android.view.View
import androidx.compose.runtime.MutableState
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.PropSetException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.AnyType
import kotlin.reflect.KProperty1

class ComposeViewProp(
  name: String,
  anyType: AnyType,
  val property: KProperty1<*, *>
) : AnyViewProp(name, anyType) {

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View, appContext: AppContext?) {
    exceptionDecorator({
      PropSetException(name, onView::class, it)
    }) {
      val props = (onView as ExpoComposeView<*>).props ?: return
      val mutableState = property.getter.call(props)
      if (mutableState is MutableState<*>) {
        (mutableState as MutableState<Any?>).value = type.convert(prop, appContext)
      } else {
        logger.warn("⚠️ Property $name is not a MutableState in ${onView::class.java}")
      }
    }
  }

  override val isNullable: Boolean = anyType.kType.isMarkedNullable
}
