package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.ExpectedType
import kotlin.reflect.KType

fun KType.toAnyType(): AnyType = AnyType(this)

class AnyType(val kType: KType) {
  private val converter: TypeConverter<*> by lazy {
    TypeConverterProviderImpl.obtainTypeConverter(kType)
  }

  fun convert(value: Any?, appContext: AppContext? = null): Any? = converter.convert(value, appContext)

  fun getCppRequiredTypes(): ExpectedType = converter.getCppRequiredTypes()
}
