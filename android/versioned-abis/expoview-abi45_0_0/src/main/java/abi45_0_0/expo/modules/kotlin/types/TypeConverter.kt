package abi45_0_0.expo.modules.kotlin.types

import abi45_0_0.com.facebook.react.bridge.Dynamic
import abi45_0_0.expo.modules.kotlin.exception.NullArgumentException

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
