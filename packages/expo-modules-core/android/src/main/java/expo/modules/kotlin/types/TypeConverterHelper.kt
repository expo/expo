package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.IncompatibleArgTypeException
import expo.modules.kotlin.exception.NullArgumentException
import expo.modules.kotlin.records.RecordTypeConverter
import expo.modules.kotlin.toKType
import kotlin.reflect.KType

object TypeConverterHelper {
  private val converters = listOf(
    BasicTypeConverter(),
    ArrayTypeConverter(),
    ListTypeConverter(),
    MapTypeConverter(),
    RecordTypeConverter()
  )

  @Suppress("UNCHECKED_CAST")
  fun convert(jsValue: Dynamic, toType: KType): Any? {
    if (jsValue.isNull) {
      if (!toType.isMarkedNullable) {
        throw NullArgumentException(toType)
      }

      return null
    }

    try {
      val typeWrapper = KClassTypeWrapper(toType)
      converters.forEach {
        if (it.canHandleConversion(typeWrapper)) {
          return it.convert(jsValue, typeWrapper)
        }
      }
    } catch (castException: ClassCastException) {
      throw IncompatibleArgTypeException(jsValue.type.toKType(), toType, castException)
    }

    throw IncompatibleArgTypeException(jsValue.type.toKType(), toType)
  }
}
