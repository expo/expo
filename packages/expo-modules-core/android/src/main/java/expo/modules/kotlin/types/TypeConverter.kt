package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.NullArgumentException

abstract class TypeConverter<Type : Any>(
  private val isOptional: Boolean
) {
  open fun convert(value: Dynamic): Type? {
    if (value.isNull) {
      if (isOptional) {
        return null
      }
      throw NullArgumentException()
    }
    return convertNonOptional(value)
  }

  abstract fun convertNonOptional(value: Dynamic): Type
}
