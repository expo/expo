package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.MissingTypeConverter
import kotlin.reflect.KClass
import kotlin.reflect.KType

class TypeConverterCollection<Type : Any> : TypeConverter<Type>() {
  @PublishedApi
  internal var converters: MutableMap<KClass<*>, (Any) -> Type> = mutableMapOf()

  inline fun <reified P0> from(crossinline body: (p0: P0) -> Type): TypeConverterCollection<Type> {
    converters[P0::class] = { value ->
      body(value as P0)
    }

    return this
  }

  override fun convert(value: Any?, context: AppContext?): Type? {
    if (value == null) {
      return null
    }
    val converter = converters[value::class] ?: throw MissingTypeConverter(value::class as KType)
    return converter(value)
  }
}
