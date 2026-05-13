package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.descriptors.TypeDescriptor

class ArrayTypeConverter(
  converterProvider: TypeConverterProvider,
  private val arrayType: TypeDescriptor
) : DynamicAwareTypeConverters<Array<*>>() {
  private val arrayElementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(arrayType.params.firstOrNull()) {
      "The array type should contain the type of the elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Array<*> {
    val jsArray = value.asArray() ?: throw DynamicCastException(ReadableArray::class)
    val array = createTypedArray(jsArray.size())
    for (i in 0 until jsArray.size()) {
      array[i] = jsArray
        .getDynamic(i)
        .recycle {
          exceptionDecorator({ cause ->
            CollectionElementCastException(arrayType, arrayType.params.first(), type, cause)
          }) {
            arrayElementConverter.convert(this, context, forceConversion)
          }
        }
    }
    return array
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Array<*> {
    return if (arrayElementConverter.isTrivial() && !forceConversion) {
      value as Array<*>
    } else {
      (value as Array<*>).map {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            arrayType,
            arrayType.params.first(),
            it!!::class,
            cause
          )
        }) {
          arrayElementConverter.convert(it, context, forceConversion)
        }
      }.toTypedArray()
    }
  }

  /**
   * We can't use an Array<Any?> here. We have to create a typed array.
   * Otherwise, cast which is done before calling lambda provided by the user will always fail.
   * For JVM, Array<String> is a different type than Array<Any?>.
   * The first one is translated to `[Ljava.lang.String;` but the second one is translated to `[java.lang.Object;`.
   */
  @Suppress("UNCHECKED_CAST")
  private fun createTypedArray(size: Int): Array<Any?> {
    val parameterType = arrayType.params.first().jClass
    val boxedType = parameterType.toBoxedIfPrimitive()
    return java.lang.reflect.Array.newInstance(
      boxedType,
      size
    ) as Array<Any?>
  }

  override fun getCppRequiredTypes(): ExpectedType =
    ExpectedType.forArray(arrayElementConverter.getCppRequiredTypes())

  override fun isTrivial() = arrayElementConverter.isTrivial()
}

internal fun isPrimitiveArray(typeDescriptor: TypeDescriptor): Boolean {
  return when (typeDescriptor.jClass) {
    BooleanArray::class.java,
    ByteArray::class.java,
    CharArray::class.java,
    ShortArray::class.java,
    IntArray::class.java,
    LongArray::class.java,
    FloatArray::class.java,
    DoubleArray::class.java -> typeDescriptor.params.isEmpty()
    else -> false
  }
}
