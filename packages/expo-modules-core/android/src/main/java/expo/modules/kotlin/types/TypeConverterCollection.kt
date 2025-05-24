package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.exception.toCodedException
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

  override fun convertNonOptional(value: Any, context: AppContext?, forceConversion: Boolean): Type {
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
        return convertNonOptional(ExpoDynamic(value), context, forceConversion)
      }

      throw MissingTypeConverter(type)
    }

    if (possibleConverters.size > 1) {
      val errors = mutableListOf<CodedException>()
      for ((type, userConverter) in possibleConverters) {
        try {
          val inputConverter = TypeConverterProviderImpl.obtainTypeConverter(type)
          val input = inputConverter.convert(value, context, forceConversion = true)
          return userConverter.invoke(input)
        } catch (e: Exception) {
          errors.add(e.toCodedException())
        }
      }
      throw TypeCastException("Cannot cast '$value' to '$type'. Tried: ${possibleConverters.joinToString { it.first.toString() }}. Errors: ${errors.joinToString { it.message ?: "" }}")
    }

    val (inputType, userConverter) = possibleConverters.first()
    val inputTypeConverter = TypeConverterProviderImpl.obtainTypeConverter(inputType)
    if (inputTypeConverter.isTrivial() && !forceConversion) {
      // If the input type converter is trivial, we can skip the conversion.
      // This is useful for types like String, Int, etc.
      return userConverter.invoke(value)
    }

    return userConverter.invoke(
      inputTypeConverter.convert(value, context, forceConversion)
    )
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType.merge(
      *converters.keys.map { key ->
        ExpectedType.fromKType(key)
      }.toTypedArray()
    )
  }
}
