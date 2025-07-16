package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CollectionElementCastException
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType
import expo.modules.kotlin.recycle
import kotlin.reflect.KType

class PairTypeConverter(
  converterProvider: TypeConverterProvider,
  private val pairType: KType
) : DynamicAwareTypeConverters<Pair<*, *>>() {
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

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Pair<*, *> {
    val jsArray = value.asArray() ?: throw DynamicCastException(ReadableArray::class)
    return convertFromReadableArray(jsArray, context, forceConversion)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Pair<*, *> {
    if (value is ReadableArray) {
      return convertFromReadableArray(value, context, forceConversion)
    }

    return value as Pair<*, *>
  }

  private fun convertFromReadableArray(jsArray: ReadableArray, context: AppContext?, forceConversion: Boolean): Pair<*, *> {
    return Pair(
      convertElement(context, jsArray, 0, forceConversion),
      convertElement(context, jsArray, 1, forceConversion)
    )
  }

  private fun convertElement(context: AppContext?, array: ReadableArray, index: Int, forceConversion: Boolean): Any? {
    return array.getDynamic(index).recycle {
      exceptionDecorator({ cause ->
        CollectionElementCastException(pairType, pairType.arguments[index].type!!, type, cause)
      }) {
        converters[index].convert(this, context, forceConversion)
      }
    }
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(
    SingleType(CppType.READABLE_ARRAY)
  )

  override fun isTrivial() = false
}
