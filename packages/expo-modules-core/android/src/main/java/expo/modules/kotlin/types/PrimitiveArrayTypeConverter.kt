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
    IntArray::class.java,
    DoubleArray::class.java,
    BooleanArray::class.java,
    LongArray::class.java,
    ByteArray::class.java,
    CharArray::class.java,
    FloatArray::class.java,
    ShortArray::class.java -> true
    else -> false
  }
}
