package abi45_0_0.expo.modules.kotlin.types

import abi45_0_0.com.facebook.react.bridge.Dynamic
import abi45_0_0.expo.modules.kotlin.exception.CollectionElementCastException
import abi45_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi45_0_0.expo.modules.kotlin.recycle
import kotlin.reflect.KType

class ListTypeConverter(
  converterProvider: TypeConverterProvider,
  private val listType: KType,
) : TypeConverter<List<*>>(listType.isMarkedNullable) {
  private val elementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(listType.arguments.first().type) {
      "The list type should contain the type of elements."
    }
  )

  override fun convertNonOptional(value: Dynamic): List<*> {
    val jsArray = value.asArray()
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
}
