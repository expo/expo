package abi46_0_0.expo.modules.kotlin.types

import abi46_0_0.com.facebook.react.bridge.Dynamic
import abi46_0_0.com.facebook.react.bridge.ReadableArray
import abi46_0_0.expo.modules.kotlin.exception.CollectionElementCastException
import abi46_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi46_0_0.expo.modules.kotlin.jni.CppType
import abi46_0_0.expo.modules.kotlin.recycle
import kotlin.reflect.KType

class ListTypeConverter(
  converterProvider: TypeConverterProvider,
  private val listType: KType,
) : DynamicAwareTypeConverters<List<*>>(listType.isMarkedNullable) {
  private val elementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(listType.arguments.first().type) {
      "The list type should contain the type of elements."
    }
  )

  override fun convertFromDynamic(value: Dynamic): List<*> {
    val jsArray = value.asArray()
    return convertFromReadableArray(jsArray)
  }

  override fun convertFromAny(value: Any): List<*> {
    if (value is ReadableArray) {
      return convertFromReadableArray(value)
    }

    return value as List<*>
  }

  private fun convertFromReadableArray(jsArray: ReadableArray): List<*> {
    return List(jsArray.size()) { index ->
      jsArray.getDynamic(index).recycle {
        exceptionDecorator({ cause ->
          CollectionElementCastException(listType, listType.arguments.first().type!!, type, cause)
        }) {
          elementConverter.convert(this)
        }
      }
    }
  }

  override fun getCppRequiredTypes(): List<CppType> = listOf(CppType.READABLE_ARRAY)
}
