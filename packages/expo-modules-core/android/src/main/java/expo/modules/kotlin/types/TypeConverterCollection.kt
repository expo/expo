package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.jni.ExpectedType
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class TypeConverterCollection<Type : Any>(val type: KType) : TypeConverter<Type>() {
  @PublishedApi
  internal var converters: MutableMap<KType, (Any?) -> Type> = mutableMapOf()

  inline fun <reified P0> from(crossinline body: (p0: P0) -> Type): TypeConverterCollection<Type> {
    converters[typeOf<P0>()] = { value ->
      body(value as P0)
    }

    return this
  }

  override fun convert(value: Any?, context: AppContext?): Type {
    val converter = converters.firstNotNullOfOrNull { (key, converter) ->
      val kClass = key.classifier as? KClass<*>
      if (kClass?.isInstance(value) == true) {
        return@firstNotNullOfOrNull converter
      }
      return@firstNotNullOfOrNull null
    }
    converter ?: throw MissingTypeConverter(type)
    return converter(value)
  }

  override fun getCppRequiredTypes(): ExpectedType {
    val possibleTypes = converters.keys.flatMap { key ->
      ExpectedType.fromKType(key).getPossibleTypes().map { it }
    }.toTypedArray()
    return ExpectedType(*possibleTypes)
  }
}
