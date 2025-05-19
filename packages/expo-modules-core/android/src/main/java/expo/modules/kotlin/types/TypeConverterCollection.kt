package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.jni.ExpectedType
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class TypeConverterComponent<Type : Any>(val notNullableType: KType, val nullableType: KType) {
  val nonNullableConverter = lazy { TypeConverterCollection<Type>(notNullableType, false) }
  val nullableConverter = lazy { TypeConverterCollection<Type>(nullableType, true) }

  inline fun <reified P0 : Any> from(crossinline body: (p0: P0) -> Type): TypeConverterComponent<Type> {
    nonNullableConverter.value.from(body)
    nullableConverter.value.from(body)
    return this
  }

  fun build(): List<Pair<KType, TypeConverter<*>>> {
    if (nonNullableConverter.isInitialized() && nullableConverter.isInitialized()) {
      return listOf(
        notNullableType to nonNullableConverter.value,
        nullableType to nullableConverter.value
      )
    }

    return emptyList()
  }
}

class TypeConverterCollection<Type : Any>(
  val type: KType,
  isOptional: Boolean
) : NullAwareTypeConverter<Type>(isOptional) {
  @PublishedApi
  internal var converters: MutableMap<KType, (Any?) -> Type> = mutableMapOf()

  inline fun <reified P0> from(crossinline body: (p0: P0) -> Type): TypeConverterCollection<Type> {
    converters[typeOf<P0>()] = { value ->
      enforceType<P0>(value)
      body(value)
    }

    return this
  }

  override fun convertNonOptional(value: Any, context: AppContext?): Type {
    val possibleConverters = converters
      .map { (key, converter) -> key to converter }
      .filter { (key, _) ->
        val kClass = key.classifier as? KClass<*>
        kClass?.isInstance(value) == true
      }

    if (possibleConverters.isEmpty()) {
      // We don't have a converter for Dynamic, but we can try to convert it to ExpoDynamic
      // and see if we have a converter for that.
      if (value is Dynamic) {
        return convertNonOptional(ExpoDynamic(value), context)
      }

      throw MissingTypeConverter(type)
    }

    if (possibleConverters.size > 1) {
      throw TypeCastException("Cannot cast '$value' to '$type'. Type converters conflict")
    }

    return possibleConverters.first().second.invoke(value)
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType.merge(
      *converters.keys.map { key ->
        ExpectedType.fromKType(key)
      }.toTypedArray()
    )
  }
}
