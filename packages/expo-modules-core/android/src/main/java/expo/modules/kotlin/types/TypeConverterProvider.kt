@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import android.graphics.Color
import android.net.Uri
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.RecordTypeConverter
import expo.modules.kotlin.typedarray.BigInt64Array
import expo.modules.kotlin.typedarray.BigUint64Array
import expo.modules.kotlin.typedarray.Float32Array
import expo.modules.kotlin.typedarray.Float64Array
import expo.modules.kotlin.typedarray.Int16Array
import expo.modules.kotlin.typedarray.Int32Array
import expo.modules.kotlin.typedarray.Int8Array
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.typedarray.Uint16Array
import expo.modules.kotlin.typedarray.Uint32Array
import expo.modules.kotlin.typedarray.Uint8Array
import expo.modules.kotlin.typedarray.Uint8ClampedArray
import expo.modules.kotlin.types.io.FileTypeConverter
import expo.modules.kotlin.types.io.PathTypeConverter
import expo.modules.kotlin.types.net.JavaURITypeConverter
import expo.modules.kotlin.types.net.URLTypConverter
import expo.modules.kotlin.types.net.UriTypeConverter
import java.io.File
import java.net.URI
import java.net.URL
import java.nio.file.Path
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

    return handelEither(type, kClass) ?: throw MissingTypeConverter(type)
  }

  @OptIn(EitherType::class)
  private fun handelEither(type: KType, kClass: KClass<*>): TypeConverter<*>? {
    if (kClass.isSubclassOf(Either::class)) {
      if (kClass.isSubclassOf(EitherOfFour::class)) {
        return EitherOfFourTypeConverter<Any, Any, Any, Any>(this, type)
      }
      if (kClass.isSubclassOf(EitherOfThree::class)) {
        return EitherOfThreeTypeConverter<Any, Any, Any>(this, type)
      }
      return EitherTypeConverter<Any, Any>(this, type)
    }

    return null
  }

  private fun createCashedConverters(isOptional: Boolean): Map<KType, TypeConverter<*>> {
    val intTypeConverter = createTrivialTypeConverter(
      isOptional, ExpectedType(CppType.INT)
    ) { it.asDouble().toInt() }
    val doubleTypeConverter = createTrivialTypeConverter(
      isOptional, ExpectedType(CppType.DOUBLE)
    ) { it.asDouble() }
    val floatTypeConverter = createTrivialTypeConverter(
      isOptional, ExpectedType(CppType.FLOAT)
    ) { it.asDouble().toFloat() }
    val boolTypeConverter = createTrivialTypeConverter(
      isOptional, ExpectedType(CppType.BOOLEAN)
    ) { it.asBoolean() }

    val converters = mapOf(
      Int::class.createType(nullable = isOptional) to intTypeConverter,
      java.lang.Integer::class.createType(nullable = isOptional) to intTypeConverter,

      Double::class.createType(nullable = isOptional) to doubleTypeConverter,
      java.lang.Double::class.createType(nullable = isOptional) to doubleTypeConverter,

      Float::class.createType(nullable = isOptional) to floatTypeConverter,
      java.lang.Float::class.createType(nullable = isOptional) to floatTypeConverter,

      Boolean::class.createType(nullable = isOptional) to boolTypeConverter,
      java.lang.Boolean::class.createType(nullable = isOptional) to boolTypeConverter,

      String::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.STRING)
      ) { it.asString() },

      ReadableArray::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.READABLE_ARRAY)
      ) { it.asArray() },
      ReadableMap::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.READABLE_MAP)
      ) { it.asMap() },

      IntArray::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.INT)
      ) {
        val jsArray = it.asArray()
        IntArray(jsArray.size()) { index ->
          jsArray.getInt(index)
        }
      },
      DoubleArray::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.DOUBLE)
      ) {
        val jsArray = it.asArray()
        DoubleArray(jsArray.size()) { index ->
          jsArray.getDouble(index)
        }
      },
      FloatArray::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.FLOAT)
      ) {
        val jsArray = it.asArray()
        FloatArray(jsArray.size()) { index ->
          jsArray.getDouble(index).toFloat()
        }
      },
      BooleanArray::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.BOOLEAN)
      ) {
        val jsArray = it.asArray()
        BooleanArray(jsArray.size()) { index ->
          jsArray.getBoolean(index)
        }
      },

      JavaScriptValue::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.JS_VALUE)
      ),
      JavaScriptObject::class.createType(nullable = isOptional) to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.JS_OBJECT)
      ),

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
      TypedArray::class.createType(nullable = isOptional) to TypedArrayTypeConverter(isOptional),

      Color::class.createType(nullable = isOptional) to ColorTypeConverter(isOptional),

      URL::class.createType(nullable = isOptional) to URLTypConverter(isOptional),
      Uri::class.createType(nullable = isOptional) to UriTypeConverter(isOptional),
      URI::class.createType(nullable = isOptional) to JavaURITypeConverter(isOptional),

      File::class.createType(nullable = isOptional) to FileTypeConverter(isOptional),

      Any::class.createType(nullable = isOptional) to AnyTypeConverter(isOptional),
    )

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      return converters + mapOf(
        Path::class.createType(nullable = isOptional) to PathTypeConverter(isOptional),
      )
    }

    return converters
  }
}
