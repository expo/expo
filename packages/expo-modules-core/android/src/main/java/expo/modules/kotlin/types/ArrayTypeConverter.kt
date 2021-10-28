package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic

class ArrayTypeConverter : TypeConverter {
  override fun canHandleConversion(toType: KClassTypeWrapper): Boolean =
    toType.classifier.java.isArray

  override fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any {
    val argumentType = toType.arguments[0].type
    requireNotNull(argumentType) { "The array type should contain the argument type." }

    val jsArray = jsValue.asArray()
    val result = Array<Any?>(jsArray.size()) { null }

    for (i in 0 until jsArray.size()) {
      result[i] = TypeConverterHelper.convert(jsArray.getDynamic(i), argumentType)
    }

    return result
  }
}
