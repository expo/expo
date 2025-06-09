package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType

class NullableTypeConverter<Type : Any>(
  private val innerConverter: TypeConverter<Type>
) : TypeConverter<Type> {

  override fun convert(value: Any?, context: AppContext?, forceConversion: Boolean): Type? {
    if (value == null || value is Dynamic && value.isNull) {
      return null
    }

    if (innerConverter.isTrivial() && !forceConversion && value !is Dynamic) {
      @Suppress("UNCHECKED_CAST")
      return value as Type
    }

    return innerConverter.convert(value, context, forceConversion)
  }

  override fun isTrivial(): Boolean = innerConverter.isTrivial()

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(
    SingleType(
      CppType.NULLABLE,
      arrayOf(innerConverter.getCppRequiredTypes())
    )
  )
}
