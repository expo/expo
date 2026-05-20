package expo.modules.kotlin.views

import android.view.View
import androidx.compose.runtime.MutableState
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.PropSetException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.AnyType
import kotlin.reflect.full.instanceParameter
import kotlin.reflect.full.memberFunctions

class ComposeViewProp(
  name: String,
  anyType: AnyType,
  val propertyGetter: (Any) -> Any?
) : AnyViewProp(name, anyType) {
  private var _isStateProp = false

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View, appContext: AppContext?) {
    setPropDirectly(prop = prop, onView = onView, appContext = appContext)
  }

  override fun set(prop: Any?, onView: View, appContext: AppContext?) {
    setPropDirectly(prop = prop, onView = onView, appContext = appContext)
  }

  @PublishedApi
  internal fun setPropDirectly(prop: Dynamic, onProps: Any, appContext: AppContext?): Any {
    return copyPropsWithNewValue(prop, onProps, appContext) ?: onProps
  }

  @Suppress("UNCHECKED_CAST")
  private fun setPropDirectly(prop: Any?, onView: View, appContext: AppContext?) {
    exceptionDecorator({
      PropSetException(name, onView::class, it)
    }) {
      val props = (onView as ExpoComposeView<*>).props ?: return@exceptionDecorator

      if (onView is ComposeFunctionHolder<*>) {
        // Use current props state, not the initial props instance
        val currentProps = onView.propsMutableState.value
        val result = copyPropsWithNewValue(prop, currentProps, appContext) ?: return@exceptionDecorator
        // Set the new props instance back to the onView
        (onView.propsMutableState as MutableState<Any?>).value = result
        return@exceptionDecorator
      }

      val mutableState = propertyGetter(props)
      if (mutableState is MutableState<*>) {
        (mutableState as MutableState<Any?>).value = type.convert(prop, appContext)
      } else {
        logger.warn("⚠️ Property $name is not a MutableState in ${onView::class.java}")
      }
    }
  }

  private fun copyPropsWithNewValue(prop: Any?, currentProps: Any, appContext: AppContext?): Any? {
    // TODO(@lukmccall): We should remove the copy call
    val copy = currentProps::class.memberFunctions.firstOrNull { it.name == "copy" }
    if (copy == null) {
      logger.warn("⚠️ Props are not a data class with default values for all properties, cannot set prop $name dynamically.")
      return null
    }
    val instanceParam = copy.instanceParameter!!
    val newPropParam = copy.parameters.firstOrNull { it.name == name } ?: return null
    return copy.callBy(mapOf(instanceParam to currentProps, newPropParam to type.convert(prop, appContext)))
  }

  fun asStateProp(): ComposeViewProp {
    _isStateProp = true
    return this
  }

  override val isNullable: Boolean = anyType.typeDescriptor.isNullable

  override val isStateProp: Boolean
    get() = _isStateProp
}
