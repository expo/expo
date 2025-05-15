@file:Suppress("FunctionName")

package expo.modules.kotlin.modules

import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.types.TypeConverter
import expo.modules.kotlin.types.TypeConverterCollection
import expo.modules.kotlin.types.TypeConverterProvider
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class ModuleConvertersBuilder {
  @PublishedApi
  internal var typeConverters: MutableMap<KClass<*>, TypeConverter<*>> = mutableMapOf()

  inline fun <reified T : Any> TypeConverter(classifier: KClass<T>, body: () -> TypeConverter<T>) {
    typeConverters[classifier] = body()
  }

  inline fun <reified T : Any> TypeConverter(classifier: KClass<T>): TypeConverterCollection<T> {
    val converter = TypeConverterCollection<T>(typeOf<T>())
    typeConverters[classifier] = converter
    return converter
  }

  inline fun <reified T : Any, reified P0> TypeConverter(classifier: KClass<T>, crossinline body: (p0: P0) -> T): TypeConverterCollection<T> {
    val converter = TypeConverterCollection<T>(typeOf<T>()).from<P0>(body)
    typeConverters[classifier] = converter
    return converter
  }

  fun buildTypeConverterProvider(): TypeConverterProvider {
    return object : TypeConverterProvider {
      override fun obtainTypeConverter(type: KType): TypeConverter<*> {
        val classifier = type.classifier as? KClass<*>
        val typeConverter = typeConverters[classifier]
        if (typeConverter != null) {
          return typeConverter
        } else {
          throw MissingTypeConverter(type)
        }
      }
    }
  }
}
