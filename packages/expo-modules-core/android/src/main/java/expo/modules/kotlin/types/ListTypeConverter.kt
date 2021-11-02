package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.iterator
import kotlin.reflect.full.isSubclassOf

class ListTypeConverter : TypeConverter {
  override fun canHandleConversion(toType: KClassTypeWrapper): Boolean =
    toType.classifier.isSubclassOf(List::class)

  override fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any {
    val argumentType = toType.arguments[0].type
    requireNotNull(argumentType) { "The list type should contain the argument type." }

    val jsArray = jsValue.asArray()
    val result = ArrayList<Any?>(jsArray.size())

    jsArray.iterator().forEach {
      result.add(TypeConverterHelper.convert(it, argumentType))
    }

    return result
  }
}
