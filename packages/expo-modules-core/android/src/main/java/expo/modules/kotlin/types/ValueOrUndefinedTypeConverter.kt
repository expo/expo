package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType
import kotlin.reflect.KType

class ValueOrUndefinedTypeConverter(
  converterProvider: TypeConverterProvider,
  innerType: KType
) : TypeConverter<ValueOrUndefined<*>> {
  private val innerTypeConverter = converterProvider.obtainTypeConverter(
    requireNotNull(innerType.arguments.first().type) {
      "The ValueOrUndefined type should contain the argument type."
    }
  )

  override fun convert(value: Any?, context: AppContext?, forceConversion: Boolean): ValueOrUndefined<*>? {
    return if (value is ValueOrUndefined.Undefined) {
      ValueOrUndefined.Undefined
    } else {
      val converterValue = innerTypeConverter.convert(value, context)
      ValueOrUndefined.Value(converterValue)
    }
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType(
      SingleType(
        CppType.VALUE_OR_UNDEFINED,
        arrayOf(innerTypeConverter.getCppRequiredTypes())
      )
    )
  }

  override fun isTrivial() = false
}
