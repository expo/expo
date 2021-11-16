package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.recycle
import kotlin.reflect.KType

class ListTypeConverter(
  converterProvider: TypeConverterProvider,
  type: KType,
) : TypeConverter<List<*>>(type.isMarkedNullable) {
  private val elementConverter = converterProvider.obtainTypeConverter(
    requireNotNull(type.arguments.first().type) {
      "The list type should contain the type of elements."
    }
  )

  override fun convertNonOptional(value: Dynamic): List<*> {
    val jsArray = value.asArray()
    return List(jsArray.size()) { index ->
      jsArray.getDynamic(index).recycle {
        elementConverter.convert(this)
      }
    }
  }
}
