package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic

class PairTypeConverter : TypeConverter {
  override fun canHandleConversion(toType: KClassTypeWrapper): Boolean =
    toType.classifier == Pair::class

  override fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any {
    val firstParameterType = toType.arguments[0].type
    requireNotNull(firstParameterType) { "The pair type should contain the type of the first parameter." }
    val secondParameterType = toType.arguments[1].type
    requireNotNull(secondParameterType) { "The pair type should contain the type of the second parameter." }

    val jsArray = jsValue.asArray()

    return Pair(
      TypeConverterHelper.convert(jsArray.getDynamic(0), firstParameterType),
      TypeConverterHelper.convert(jsArray.getDynamic(1), secondParameterType)
    )
  }
}
