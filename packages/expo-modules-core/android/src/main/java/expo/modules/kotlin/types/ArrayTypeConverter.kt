package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.recycle
import kotlin.reflect.KClass
import kotlin.reflect.KType

class ArrayTypeConverter(
  converterProvider: TypeConverterProvider,
  private val arrayType: KType,
) : DynamicAwareTypeConverters<Array<*>>(arrayType.isMarkedNullable) {
  private val arrayElementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(arrayType.arguments.first().type) {
      "The array type should contain the type of the elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic): Array<*> {
    val jsArray = value.asArray()
    val array = createTypedArray(jsArray.size())
    for (i in 0 until jsArray.size()) {
      array[i] = jsArray
        .getDynamic(i)
        .recycle {
          exceptionDecorator({ cause ->
            CollectionElementCastException(arrayType, arrayType.arguments.first().type!!, type, cause)
          }) {
            arrayElementConverter.convert(this)
          }
        }
    }
    return array
  }

  override fun convertFromAny(value: Any): Array<*> {
    return if (arrayElementConverter.isTrivial()) {
      value as Array<*>
    } else {
      (value as Array<*>).map {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            arrayType,
            arrayType.arguments.first().type!!,
            it!!::class,
            cause
          )
        }) {
          arrayElementConverter.convert(it)
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
      (arrayType.arguments.first().type!!.classifier as KClass<*>).java,
      size
    ) as Array<Any?>
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.forPrimitiveArray(arrayElementConverter.getCppRequiredTypes())

  override fun isTrivial() = arrayElementConverter.isTrivial()
}
