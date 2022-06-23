package expo.modules.kotlin.types

import kotlin.reflect.KType

fun KType.toAnyType(): AnyType = AnyType(this)

class AnyType(val kType: KType) {
  private val converter: TypeConverter<*> by lazy {
    TypeConverterProviderImpl.obtainTypeConverter(kType)
  }

  fun convert(value: Any?): Any? = converter.convert(value)

  fun getCppRequiredTypes(): Int = converter.getCppRequiredTypes().fold(0) { acc, current -> acc or current.value }
}
