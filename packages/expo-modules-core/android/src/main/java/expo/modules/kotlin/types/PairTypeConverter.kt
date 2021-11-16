package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import kotlin.reflect.KType

class PairTypeConverter(
  converterProvider: TypeConverterProvider,
  type: KType,
) : TypeConverter<Pair<*, *>>(type.isMarkedNullable) {
  private val firstConverter = converterProvider.obtainTypeConverter(
    requireNotNull(type.arguments.getOrNull(0)?.type) {
      "The pair type should contain the type of the first parameter."
    }
  )
  private val secondConverter = converterProvider.obtainTypeConverter(
    requireNotNull(type.arguments.getOrNull(1)?.type) {
      "The pair type should contain the type of the second parameter."
    }
  )

  override fun convertNonOptional(value: Dynamic): Pair<*, *> {
    val jsArray = value.asArray()
    return Pair(
      firstConverter.convert(jsArray.getDynamic(0)),
      secondConverter.convert(jsArray.getDynamic(1)),
    )
  }
}
