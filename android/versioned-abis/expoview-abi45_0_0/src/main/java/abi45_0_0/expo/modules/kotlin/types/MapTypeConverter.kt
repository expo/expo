@file:OptIn(ExperimentalStdlibApi::class)

package abi45_0_0.expo.modules.kotlin.types

import abi45_0_0.com.facebook.react.bridge.Dynamic
import abi45_0_0.com.facebook.react.bridge.DynamicFromObject
import abi45_0_0.expo.modules.kotlin.exception.CollectionElementCastException
import abi45_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi45_0_0.expo.modules.kotlin.recycle
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class MapTypeConverter(
  converterProvider: TypeConverterProvider,
  private val mapType: KType
) : TypeConverter<Map<*, *>>(mapType.isMarkedNullable) {
  init {
    require(mapType.arguments.first().type == typeOf<String>()) {
      "The map key type should be String, but received ${mapType.arguments.first()}."
    }
  }

  private val valueConverter = converterProvider.obtainTypeConverter(
    requireNotNull(mapType.arguments.getOrNull(1)?.type) {
      "The map type should contain the key type."
    }
  )

  override fun convertNonOptional(value: Dynamic): Map<*, *> {
    val jsMap = value.asMap()
    val result = mutableMapOf<String, Any?>()

    jsMap.entryIterator.forEach { (key, value) ->
      DynamicFromObject(value).recycle {
        exceptionDecorator({ cause ->
          CollectionElementCastException(mapType, mapType.arguments[1].type!!, type, cause)
        }) {
          result[key] = valueConverter.convert(this)
        }
      }
    }

    return result
  }
}
