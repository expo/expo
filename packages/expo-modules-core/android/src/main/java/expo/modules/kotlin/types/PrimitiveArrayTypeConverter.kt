package expo.modules.kotlin.types

import expo.modules.kotlin.jni.ExpectedType
import kotlin.reflect.KType

class PrimitiveArrayTypeConverter(
  converterProvider: TypeConverterProvider,
  primitiveArrayType: KType
) : ArrayTypeConverter(converterProvider, primitiveArrayType) {
  override fun getCppRequiredTypes(): ExpectedType =
    ExpectedType.forPrimitiveArray(arrayElementConverter.getCppRequiredTypes())
}

fun isPrimitiveArray(clazz: Class<*>): Boolean {
  return when (clazz) {
    BooleanArray::class.java,
    ByteArray::class.java,
    CharArray::class.java,
    ShortArray::class.java,
    IntArray::class.java,
    LongArray::class.java,
    FloatArray::class.java,
    DoubleArray::class.java -> true
    else -> false
  }
}
