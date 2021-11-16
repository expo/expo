@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import expo.modules.kotlin.recycle
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class MapTypeConverter(
  converterProvider: TypeConverterProvider,
  type: KType
) : TypeConverter<Map<*, *>>(type.isMarkedNullable) {
  init {
    require(type.arguments.first().type == typeOf<String>()) {
      "The map key type should be String, but received ${type.arguments.first()}."
    }
  }

  private val valueConverter = converterProvider.obtainTypeConverter(
    requireNotNull(type.arguments.getOrNull(1)?.type) {
      "The map type should contain the key type."
    }
  )

  override fun convertNonOptional(value: Dynamic): Map<*, *> {
    val jsMap = value.asMap()
    val result = mutableMapOf<String, Any?>()

    jsMap.entryIterator.forEach { (key, value) ->
      DynamicFromObject(value).recycle {
        result[key] = valueConverter.convert(this)
      }
    }

    return result
  }
}
