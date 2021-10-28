package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.records.RecordTypeConverter
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
        throw IllegalArgumentException("Cannot assign null to not nullable type.")
      }

      return null
    }

    val typeWrapper = KClassTypeWrapper(toType)
    converters.forEach {
      if (it.canHandleConversion(typeWrapper)) {
        return it.convert(jsValue, typeWrapper)
      }
    }

    throw IllegalArgumentException("Cannot convert JavaScript object into $toType")
  }
}
