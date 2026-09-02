package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.ConverterContext

abstract class AnyViewProp(
  val name: String,
  internal val type: AnyType
) {
  abstract fun set(prop: Dynamic, onView: View, converterContext: ConverterContext)

  abstract fun set(prop: Any?, onView: View, converterContext: ConverterContext)

  abstract val isNullable: Boolean

  internal abstract val isStateProp: Boolean
}
