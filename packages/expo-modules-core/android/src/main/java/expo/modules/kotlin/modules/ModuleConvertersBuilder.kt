@file:Suppress("FunctionName")

package expo.modules.kotlin.modules

import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.types.TypeConverter
import expo.modules.kotlin.types.TypeConverterComponent
import expo.modules.kotlin.types.TypeConverterProvider
import expo.modules.kotlin.types.lazyTypeOf
import kotlin.reflect.KClass
import kotlin.reflect.KType

class ModuleConvertersBuilder {
  @PublishedApi
  internal var convertersComponent = mutableListOf<TypeConverterComponent<*>>()

  inline fun <reified T : Any> TypeConverter(classifier: KClass<T>): TypeConverterComponent<T> {
    val converterComponent = TypeConverterComponent<T>(lazyTypeOf<T>(), lazyTypeOf<(T?)?>())
    convertersComponent.add(converterComponent)
    return converterComponent
  }

  inline fun <reified T : Any, reified P0 : Any> TypeConverter(
    classifier: KClass<T>,
    crossinline body: (p0: P0) -> T
  ): TypeConverterComponent<T> {
    return TypeConverter<T>(classifier).apply {
      from<P0> { value ->
        body(value)
      }
    }
  }

  fun buildTypeConverterProvider(): TypeConverterProvider {
    val converterMap = convertersComponent
      .map { it.build() }
      .flatten()
      .toMap()
    return object : TypeConverterProvider {
      override fun obtainTypeConverter(type: KType): TypeConverter<*> {
        val typeConverter = converterMap[type]
        if (typeConverter != null) {
          return typeConverter
        } else {
          throw MissingTypeConverter(type)
        }
      }
    }
  }
}
