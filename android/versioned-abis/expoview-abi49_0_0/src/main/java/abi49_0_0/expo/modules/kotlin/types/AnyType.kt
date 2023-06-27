package abi49_0_0.expo.modules.kotlin.types

import abi49_0_0.expo.modules.kotlin.AppContext
import abi49_0_0.expo.modules.kotlin.jni.ExpectedType
import kotlin.reflect.KType

fun KType.toAnyType(): AnyType = AnyType(this)

class AnyType(val kType: KType) {
  private val converter: TypeConverter<*> by lazy {
    TypeConverterProviderImpl.obtainTypeConverter(kType)
  }

  fun convert(value: Any?, appContext: AppContext? = null): Any? = converter.convert(value, appContext)

  fun getCppRequiredTypes(): ExpectedType = converter.getCppRequiredTypes()
}
