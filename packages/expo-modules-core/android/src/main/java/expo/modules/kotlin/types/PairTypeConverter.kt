package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.recycle
import kotlin.reflect.KType

class PairTypeConverter(
  converterProvider: TypeConverterProvider,
  private val pairType: KType,
) : DynamicAwareTypeConverters<Pair<*, *>>(pairType.isMarkedNullable) {
  private val converters = listOf(
    converterProvider.obtainTypeConverter(
      requireNotNull(pairType.arguments.getOrNull(0)?.type) {
        "The pair type should contain the type of the first parameter."
      }
    ),
    converterProvider.obtainTypeConverter(
      requireNotNull(pairType.arguments.getOrNull(1)?.type) {
        "The pair type should contain the type of the second parameter."
      }
    )
  )

  override fun convertFromDynamic(value: Dynamic): Pair<*, *> {
    val jsArray = value.asArray()
    return convertFromReadableArray(jsArray)
  }

  override fun convertFromAny(value: Any): Pair<*, *> {
    if (value is ReadableArray) {
      return convertFromReadableArray(value)
    }

    return value as Pair<*, *>
  }

  private fun convertFromReadableArray(jsArray: ReadableArray): Pair<*, *> {
    return Pair(
      convertElement(jsArray, 0),
      convertElement(jsArray, 1)
    )
  }

  private fun convertElement(array: ReadableArray, index: Int): Any? {
    return array.getDynamic(index).recycle {
      exceptionDecorator({ cause ->
        CollectionElementCastException(pairType, pairType.arguments[index].type!!, type, cause)
      }) {
        converters[index].convert(this)
      }
    }
  }

  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.READABLE_ARRAY)
}
