package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import kotlin.reflect.KClass
import kotlin.reflect.KType

class PrimitiveArrayTypeConverter(
  converterProvider: TypeConverterProvider,
  private val primitiveArrayType: KType
) : DynamicAwareTypeConverters<Array<*>>() {
  private val primitiveArrayElementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(primitiveArrayType.arguments.first().type) {
      "The array type should contain the type of the elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Array<*> {
    val jsArray = value.asArray()
    val array = createTypedArray(jsArray.size())
    for (i in 0 until jsArray.size()) {
      array[i] = jsArray
        .getDynamic(i)
        .recycle {
          exceptionDecorator({ cause ->
            CollectionElementCastException(primitiveArrayType, primitiveArrayType.arguments.first().type!!, type, cause)
          }) {
            primitiveArrayElementConverter.convert(this, context, forceConversion)
          }
        }
    }
    return array
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Array<*> {
    return if (primitiveArrayElementConverter.isTrivial() && !forceConversion) {
      value as Array<*>
    } else {
      (value as Array<*>).map {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            primitiveArrayType,
            primitiveArrayType.arguments.first().type!!,
            it!!::class,
            cause
          )
        }) {
          primitiveArrayElementConverter.convert(it, context, forceConversion)
        }
      }.toTypedArray()
    }
  }

  /**
   * We can't use a Array<Any?> here. We have to create a typed array.
   * Otherwise, cast which is done before calling lambda provided by the user will always fail.
   * For JVM, Array<String> is a different type than Array<Any?>.
   * The first one is translated to `[Ljava.lang.String;` but the second one is translated to `[java.lang.Object;`.
   */
  @Suppress("UNCHECKED_CAST")
  private fun createTypedArray(size: Int): Array<Any?> {
    return java.lang.reflect.Array.newInstance(
      (primitiveArrayType.arguments.first().type!!.classifier as KClass<*>).java,
      size
    ) as Array<Any?>
  }

  override fun getCppRequiredTypes(): ExpectedType =
    ExpectedType.forPrimitiveArray(primitiveArrayElementConverter.getCppRequiredTypes())

  override fun isTrivial() = primitiveArrayElementConverter.isTrivial()
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