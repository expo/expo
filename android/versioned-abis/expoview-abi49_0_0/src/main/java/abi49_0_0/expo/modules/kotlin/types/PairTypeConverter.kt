package abi49_0_0.expo.modules.kotlin.types

import abi49_0_0.com.facebook.react.bridge.Dynamic
import abi49_0_0.com.facebook.react.bridge.ReadableArray
import abi49_0_0.expo.modules.kotlin.exception.CollectionElementCastException
import abi49_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi49_0_0.expo.modules.kotlin.jni.CppType
import abi49_0_0.expo.modules.kotlin.jni.ExpectedType
import abi49_0_0.expo.modules.kotlin.jni.SingleType
import abi49_0_0.expo.modules.kotlin.recycle
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

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(
    SingleType(CppType.READABLE_ARRAY)
  )

  override fun isTrivial() = false
}
