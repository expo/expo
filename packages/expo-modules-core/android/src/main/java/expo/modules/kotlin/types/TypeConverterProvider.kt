@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.typedarray.BigInt64Array
import expo.modules.kotlin.typedarray.BigUint64Array
import expo.modules.kotlin.typedarray.Float32Array
import expo.modules.kotlin.typedarray.Float64Array
import expo.modules.kotlin.typedarray.Int16Array
import expo.modules.kotlin.typedarray.Int32Array
import expo.modules.kotlin.typedarray.Int8Array
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.typedarray.AnyTypedArray
import expo.modules.kotlin.typedarray.Uint16Array
import expo.modules.kotlin.typedarray.Uint32Array
import expo.modules.kotlin.typedarray.Uint8Array
import expo.modules.kotlin.typedarray.Uint8ClampedArray
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.RecordTypeConverter
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.full.createType
import kotlin.reflect.full.isSubclassOf
import kotlin.reflect.typeOf

interface TypeConverterProvider {
  fun obtainTypeConverter(type: KType): TypeConverter<*>
}

inline fun <reified T : Any> obtainTypeConverter(): TypeConverter<T> {
  @Suppress("UNCHECKED_CAST")
  return TypeConverterProviderImpl.obtainTypeConverter(typeOf<T>()) as TypeConverter<T>
}

inline fun <reified T> convert(value: Dynamic): T {
  val converter = TypeConverterProviderImpl.obtainTypeConverter(typeOf<T>())
  return converter.convert(value) as T
}

inline fun <reified T> convert(value: Any?): T {
  val converter = TypeConverterProviderImpl.obtainTypeConverter(typeOf<T>())
  return converter.convert(value) as T
}

fun convert(value: Dynamic, type: KType): Any? {
  val converter = TypeConverterProviderImpl.obtainTypeConverter(type)
  return converter.convert(value)
}

object TypeConverterProviderImpl : TypeConverterProvider {
  private val cachedConverters = createCashedConverters(false) + createCashedConverters(true)
  private val cachedRecordConverters = mutableMapOf<KClass<*>, TypeConverter<*>>()

  override fun obtainTypeConverter(type: KType): TypeConverter<*> {
    cachedConverters[type]?.let {
      return it
    }

    val kClass = type.classifier as? KClass<*> ?: throw MissingTypeConverter(type)

    if (kClass.java.isArray) {
      return ArrayTypeConverter(this, type)
    }

    if (kClass.isSubclassOf(List::class)) {
      return ListTypeConverter(this, type)
    }

    if (kClass.isSubclassOf(Map::class)) {
      return MapTypeConverter(this, type)
    }

    if (kClass.isSubclassOf(Pair::class)) {
      return PairTypeConverter(this, type)
    }

    if (kClass.isSubclassOf(Array::class)) {
      return ArrayTypeConverter(this, type)
    }

    if (kClass.java.isEnum) {
      @Suppress("UNCHECKED_CAST")
      return EnumTypeConverter(kClass as KClass<Enum<*>>, type.isMarkedNullable)
    }

    val cachedConverter = cachedRecordConverters[kClass]
    if (cachedConverter != null) {
      return cachedConverter
    }

    if (kClass.isSubclassOf(Record::class)) {
      val converter = RecordTypeConverter<Record>(this, type)
      cachedRecordConverters[kClass] = converter
      return converter
    }

    throw MissingTypeConverter(type)
  }

  private fun createCashedConverters(isOptional: Boolean): Map<KType, TypeConverter<*>> {
    val intTypeConverter = IntTypeConverter(isOptional)
    val doubleTypeConverter = DoubleTypeConverter(isOptional)
    val floatTypeConverter = FloatTypeConverter(isOptional)
    val boolTypeConverter = BoolTypeConverter(isOptional)

    return mapOf(
      Int::class.createType(nullable = isOptional) to intTypeConverter,
      java.lang.Integer::class.createType(nullable = isOptional) to intTypeConverter,

      Double::class.createType(nullable = isOptional) to doubleTypeConverter,
      java.lang.Double::class.createType(nullable = isOptional) to doubleTypeConverter,

      Float::class.createType(nullable = isOptional) to floatTypeConverter,
      java.lang.Float::class.createType(nullable = isOptional) to floatTypeConverter,

      Boolean::class.createType(nullable = isOptional) to boolTypeConverter,
      java.lang.Boolean::class.createType(nullable = isOptional) to boolTypeConverter,

      String::class.createType(nullable = isOptional) to StringTypeConverter(isOptional),

      ReadableArray::class.createType(nullable = isOptional) to ReadableArrayTypeConverter(isOptional),
      ReadableMap::class.createType(nullable = isOptional) to ReadableMapTypeConverter(isOptional),

      IntArray::class.createType(nullable = isOptional) to PrimitiveIntArrayTypeConverter(isOptional),
      DoubleArray::class.createType(nullable = isOptional) to PrimitiveDoubleArrayTypeConverter(isOptional),
      FloatArray::class.createType(nullable = isOptional) to PrimitiveFloatArrayTypeConverter(isOptional),

      JavaScriptValue::class.createType(nullable = isOptional) to JavaScriptValueTypeConvert(isOptional),
      JavaScriptObject::class.createType(nullable = isOptional) to JavaScriptObjectTypeConverter(isOptional),

      Int8Array::class.createType(nullable = isOptional) to Int8ArrayTypeConverter(isOptional),
      Int16Array::class.createType(nullable = isOptional) to Int16ArrayTypeConverter(isOptional),
      Int32Array::class.createType(nullable = isOptional) to Int32ArrayTypeConverter(isOptional),
      Uint8Array::class.createType(nullable = isOptional) to Uint8ArrayTypeConverter(isOptional),
      Uint8ClampedArray::class.createType(nullable = isOptional) to Uint8ClampedArrayTypeConverter(isOptional),
      Uint16Array::class.createType(nullable = isOptional) to Uint16ArrayTypeConverter(isOptional),
      Uint32Array::class.createType(nullable = isOptional) to Uint32ArrayTypeConverter(isOptional),
      Float32Array::class.createType(nullable = isOptional) to Float32ArrayTypeConverter(isOptional),
      Float64Array::class.createType(nullable = isOptional) to Float64ArrayTypeConverter(isOptional),
      BigInt64Array::class.createType(nullable = isOptional) to BigInt64ArrayTypeConverter(isOptional),
      BigUint64Array::class.createType(nullable = isOptional) to BigUint64ArrayTypeConverter(isOptional),
      AnyTypedArray::class.createType(nullable = isOptional) to TypedArrayTypeConverter(isOptional),

      Any::class.createType(nullable = isOptional) to AnyTypeConverter(isOptional),
    )
  }
}
