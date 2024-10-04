@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import android.graphics.Color
import android.net.Uri
import android.view.View
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.annotation.Config
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.RecordTypeConverter
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectTypeConverter
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
import expo.modules.kotlin.views.ViewTypeConverter
import java.io.File
import java.net.URI
import java.net.URL
import java.nio.file.Path
import kotlin.reflect.KClass
import kotlin.reflect.KType
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
  private val cachedConverters = createCachedConverters(false)
  private val nullableCachedConverters = createCachedConverters(true)

  private val cachedRecordConverters = mutableMapOf<KClass<*>, TypeConverter<*>>()
  private val cachedCustomConverters = mutableMapOf<KType, TypeConverter<*>>()

  private fun getCachedConverter(inputType: KType): TypeConverter<*>? {
    return if (inputType.isMarkedNullable) {
      nullableCachedConverters[inputType.classifier]
    } else {
      cachedConverters[inputType.classifier]
    }
  }

  override fun obtainTypeConverter(type: KType): TypeConverter<*> {
    getCachedConverter(type)?.let {
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

    if (kClass.isSubclassOf(View::class)) {
      return ViewTypeConverter<View>(type)
    }

    if (kClass.isSubclassOf(SharedObject::class)) {
      return SharedObjectTypeConverter<SharedObject>(type)
    }

    if (kClass.isSubclassOf(JavaScriptFunction::class)) {
      return JavaScriptFunctionTypeConverter<Any>(type)
    }

    return handelEither(type, kClass)
      ?: handelCustomConverter(type, kClass)
      ?: throw MissingTypeConverter(type)
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

  private fun handelCustomConverter(type: KType, kClass: KClass<*>): TypeConverter<*>? {
    val cachedConverter = cachedCustomConverters[type]
    if (cachedConverter != null) {
      return cachedConverter
    }

    val typeName = kClass.java.canonicalName ?: return null

    val converterProviderName = "${Config.packageNamePrefix}$typeName${Config.classNameSuffix}"
    return try {
      val converterClazz = Class.forName(converterProviderName)
      val converterProvider = converterClazz.newInstance()
      val method = converterProvider.javaClass.getMethod(Config.converterProviderFunctionName, KType::class.java)

      (method.invoke(converterProvider, type) as TypeConverter<*>)
        .also {
          cachedCustomConverters[type] = it
        }
    } catch (e: Throwable) {
      null
    }
  }

  private fun createCachedConverters(isOptional: Boolean): Map<KClass<*>, TypeConverter<*>> {
    val intTypeConverter = createTrivialTypeConverter(
      isOptional, ExpectedType(CppType.INT)
    ) { it.asDouble().toInt() }
    val longTypeConverter = createTrivialTypeConverter(
      isOptional, ExpectedType(CppType.LONG)
    ) { it.asDouble().toLong() }
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
      Int::class to intTypeConverter,
      java.lang.Integer::class to intTypeConverter,

      Long::class to longTypeConverter,
      java.lang.Long::class to longTypeConverter,

      Double::class to doubleTypeConverter,
      java.lang.Double::class to doubleTypeConverter,

      Float::class to floatTypeConverter,
      java.lang.Float::class to floatTypeConverter,

      Boolean::class to boolTypeConverter,
      java.lang.Boolean::class to boolTypeConverter,

      String::class to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.STRING)
      ) { it.asString() },

      ReadableArray::class to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.READABLE_ARRAY)
      ) { it.asArray() },
      ReadableMap::class to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.READABLE_MAP)
      ) { it.asMap() },

      IntArray::class to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.INT)
      ) {
        val jsArray = it.asArray()
        IntArray(jsArray.size()) { index ->
          jsArray.getInt(index)
        }
      },
      DoubleArray::class to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.DOUBLE)
      ) {
        val jsArray = it.asArray()
        DoubleArray(jsArray.size()) { index ->
          jsArray.getDouble(index)
        }
      },
      FloatArray::class to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.FLOAT)
      ) {
        val jsArray = it.asArray()
        FloatArray(jsArray.size()) { index ->
          jsArray.getDouble(index).toFloat()
        }
      },
      BooleanArray::class to createTrivialTypeConverter(
        isOptional, ExpectedType.forPrimitiveArray(CppType.BOOLEAN)
      ) {
        val jsArray = it.asArray()
        BooleanArray(jsArray.size()) { index ->
          jsArray.getBoolean(index)
        }
      },

      JavaScriptValue::class to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.JS_VALUE)
      ),
      JavaScriptObject::class to createTrivialTypeConverter(
        isOptional, ExpectedType(CppType.JS_OBJECT)
      ),

      Int8Array::class to Int8ArrayTypeConverter(isOptional),
      Int16Array::class to Int16ArrayTypeConverter(isOptional),
      Int32Array::class to Int32ArrayTypeConverter(isOptional),
      Uint8Array::class to Uint8ArrayTypeConverter(isOptional),
      Uint8ClampedArray::class to Uint8ClampedArrayTypeConverter(isOptional),
      Uint16Array::class to Uint16ArrayTypeConverter(isOptional),
      Uint32Array::class to Uint32ArrayTypeConverter(isOptional),
      Float32Array::class to Float32ArrayTypeConverter(isOptional),
      Float64Array::class to Float64ArrayTypeConverter(isOptional),
      BigInt64Array::class to BigInt64ArrayTypeConverter(isOptional),
      BigUint64Array::class to BigUint64ArrayTypeConverter(isOptional),
      TypedArray::class to TypedArrayTypeConverter(isOptional),

      URL::class to URLTypConverter(isOptional),
      Uri::class to UriTypeConverter(isOptional),
      URI::class to JavaURITypeConverter(isOptional),

      File::class to FileTypeConverter(isOptional),

      Any::class to AnyTypeConverter(isOptional),
    )

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      return converters + mapOf(
        Path::class to PathTypeConverter(isOptional),
        Color::class to ColorTypeConverter(isOptional),
      )
    }

    return converters
  }
}
