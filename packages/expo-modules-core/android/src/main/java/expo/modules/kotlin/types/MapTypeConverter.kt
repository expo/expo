package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import kotlin.reflect.full.isSubclassOf

class MapTypeConverter : TypeConverter {
  override fun canHandleConversion(toType: KClassTypeWrapper): Boolean =
    toType.classifier.isSubclassOf(Map::class)

  override fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any {
    val keyType = toType.arguments[0].type
    val valueType = toType.arguments[1].type

    requireNotNull(keyType) { "The map type should contain the key type." }
    requireNotNull(valueType) { "The map type should contain the value type." }

    val jsMap = jsValue.asMap()
    val result = mutableMapOf<String, Any?>()

    jsMap.entryIterator.forEach { (key, value) ->
      result[key] = TypeConverterHelper.convert(DynamicFromObject(value), valueType)
    }

    return result
  }
}
