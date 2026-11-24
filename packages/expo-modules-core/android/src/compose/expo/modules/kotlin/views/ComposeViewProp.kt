package expo.modules.kotlin.views

import android.view.View
import androidx.compose.runtime.MutableState
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.PropSetException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.ConverterContext
import kotlin.reflect.full.instanceParameter
import kotlin.reflect.full.memberFunctions

class ComposeViewProp(
  name: String,
  anyType: AnyType,
  val propertyGetter: (Any) -> Any?
) : AnyViewProp(name, anyType) {
  private var _isStateProp = false

  override fun set(prop: Dynamic, onView: View, converterContext: ConverterContext) {
    set(prop = prop as Any, onView = onView, converterContext = converterContext)
  }

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Any?, onView: View, converterContext: ConverterContext) {
    exceptionDecorator({
      PropSetException(name, onView::class, it)
    }) {
      val props = (onView as ExpoComposeView<*>).props ?: return@exceptionDecorator

      if (onView is ComposeFunctionHolder<*>) {
        // Use current props state, not the initial props instance
        val currentProps = onView.propsMutableState.value
        val result = copyPropsWithNewValue(prop, currentProps, converterContext)
          ?: return@exceptionDecorator
        // Set the new props instance back to the onView
        (onView.propsMutableState as MutableState<Any?>).value = result
        return@exceptionDecorator
      }

      val mutableState = propertyGetter(props)
      if (mutableState is MutableState<*>) {
        (mutableState as MutableState<Any?>).value = type.convert(prop, converterContext)
      } else {
        logger.warn("⚠️ Property $name is not a MutableState in ${onView::class.java}")
      }
    }
  }

  @PublishedApi
  internal fun copyPropsWithNewValue(prop: Any?, currentProps: Any, converterContext: ConverterContext): Any? {
    // TODO(@lukmccall): We should remove the copy call
    val copy = currentProps::class.memberFunctions.firstOrNull { it.name == "copy" }
    if (copy == null) {
      logger.warn("⚠️ Props are not a data class with default values for all properties, cannot set prop $name dynamically.")
      return null
    }
    val instanceParam = copy.instanceParameter!!
    val newPropParam = copy.parameters.firstOrNull { it.name == name } ?: return null
    return copy.callBy(mapOf(instanceParam to currentProps, newPropParam to type.convert(prop, converterContext)))
  }

  fun asStateProp(): ComposeViewProp {
    _isStateProp = true
    return this
  }

  override val isNullable: Boolean = anyType.typeDescriptor.isNullable

  override val isStateProp: Boolean
    get() = _isStateProp
}
