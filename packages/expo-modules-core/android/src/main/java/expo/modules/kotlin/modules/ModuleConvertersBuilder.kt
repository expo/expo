@file:Suppress("FunctionName")

package expo.modules.kotlin.modules

import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.types.NullableTypeConverter
import expo.modules.kotlin.types.TypeConverter
import expo.modules.kotlin.types.TypeConverterComponent
import expo.modules.kotlin.types.TypeConverterProvider
import expo.modules.kotlin.types.descriptors.TypeDescriptor
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import kotlin.reflect.KClass

class ModuleConvertersBuilder {
  @PublishedApi
  internal var convertersComponent = mutableListOf<TypeConverterComponent<*>>()

  inline fun <reified T : Any> TypeConverter(classifier: KClass<T> = T::class): TypeConverterComponent<T> {
    val converterComponent = TypeConverterComponent<T>(typeDescriptorOf<T>())
    convertersComponent.add(converterComponent)
    return converterComponent
  }

  inline fun <reified T : Any, reified P0 : Any> TypeConverter(
    classifier: KClass<T> = T::class,
    crossinline body: (p0: P0) -> T
  ): TypeConverterComponent<T> {
    return TypeConverter<T>(classifier).apply {
      from<P0> { value ->
        body(value)
      }
    }
  }

  fun buildTypeConverterProvider(): TypeConverterProvider {
    val converters = convertersComponent
      .mapNotNull { it.build() }

    return object : TypeConverterProvider {
      override fun obtainTypeConverter(typeDescriptor: TypeDescriptor): TypeConverter<*> {
        val nonNullableTypeConverter = findNonNullableTypeConverter(typeDescriptor)
          ?: throw MissingTypeConverter(typeDescriptor)

        if (typeDescriptor.isNullable) {
          return NullableTypeConverter(nonNullableTypeConverter)
        }
        return nonNullableTypeConverter
      }

      private fun findNonNullableTypeConverter(typeDescriptor: TypeDescriptor): TypeConverter<*>? {
        return converters.find { (converterType, _) ->
          converterType.jClass == typeDescriptor.jClass && converterType.params == typeDescriptor.params
        }?.second
      }
    }
  }
}
