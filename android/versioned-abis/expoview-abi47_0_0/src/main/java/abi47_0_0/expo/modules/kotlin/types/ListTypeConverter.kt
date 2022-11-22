package abi47_0_0.expo.modules.kotlin.types

import abi47_0_0.com.facebook.react.bridge.Dynamic
import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.expo.modules.kotlin.exception.CollectionElementCastException
import abi47_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi47_0_0.expo.modules.kotlin.jni.ExpectedType
import abi47_0_0.expo.modules.kotlin.recycle
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
    return if (elementConverter.isTrivial()) {
      value as List<*>
    } else {
      (value as List<*>).map {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            listType,
            listType.arguments.first().type!!,
            it!!::class,
            cause
          )
        }) {
          elementConverter.convert(it)
        }
      }
    }
  }

  private fun convertFromReadableArray(jsArray: ReadableArray): List<*> {
    return List(jsArray.size()) { index ->
      jsArray.getDynamic(index).recycle {
        exceptionDecorator({ cause ->
          CollectionElementCastException(
            listType,
            listType.arguments.first().type!!,
            type,
            cause
          )
        }) {
          elementConverter.convert(this)
        }
      }
    }
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType.forList(elementConverter.getCppRequiredTypes())
  }

  override fun isTrivial() = elementConverter.isTrivial()
}
