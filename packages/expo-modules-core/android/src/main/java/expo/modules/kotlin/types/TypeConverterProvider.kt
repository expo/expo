package expo.modules.kotlin.types

import android.graphics.Color
import android.net.Uri
import android.view.View
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.MissingTypeConverter
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptArrayBuffer
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.jni.worklets.Serializable
import expo.modules.kotlin.jni.worklets.Worklet
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.RecordTypeConverter
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectTypeConverter
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.sharedobjects.SharedRefTypeConverter
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
import expo.modules.kotlin.types.descriptors.TypeDescriptor
import expo.modules.kotlin.types.descriptors.toTypeDescriptor
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import expo.modules.kotlin.types.io.FileTypeConverter
import expo.modules.kotlin.types.io.PathTypeConverter
import expo.modules.kotlin.types.net.JavaURITypeConverter
import expo.modules.kotlin.types.net.URLTypConverter
import expo.modules.kotlin.types.net.UriTypeConverter
import expo.modules.kotlin.types.worklets.SerializableTypeConverter
import expo.modules.kotlin.types.worklets.WorkletTypeConverter
import expo.modules.kotlin.views.ViewTypeConverter
import java.io.File
import java.net.URI
import java.net.URL
import java.nio.file.Path
import java.time.LocalDate
import kotlin.reflect.KType
import kotlin.time.Duration

interface TypeConverterProvider {
  fun obtainTypeConverter(typeDescriptor: TypeDescriptor): TypeConverter<*>
}

inline fun <reified T : Any> obtainTypeConverter(): TypeConverter<T> {
  @Suppress("UNCHECKED_CAST")
  return TypeConverterProviderImpl.obtainTypeConverter(typeDescriptorOf<T>()) as TypeConverter<T>
}

inline fun <reified T> convert(value: Dynamic): T {
  val converter = TypeConverterProviderImpl.obtainTypeConverter(typeDescriptorOf<T>())
  return converter.convert(value) as T
}

inline fun <reified T> convert(value: Any?): T {
  val converter = TypeConverterProviderImpl.obtainTypeConverter(typeDescriptorOf<T>())
  return converter.convert(value) as T
}

fun convert(value: Dynamic, type: KType): Any? {
  val converter = TypeConverterProviderImpl.obtainTypeConverter(type.toTypeDescriptor())
  return converter.convert(value)
}

object TypeConverterProviderImpl : TypeConverterProvider {
  private val cachedConverters = createCachedConverters()
  private val cachedPrimitiveArrayConverters = createCachedPrimitiveArrayConverters()

  private val cachedRecordConverters = mutableMapOf<Class<*>, TypeConverter<*>>()

  private fun getCachedConverter(inputType: TypeDescriptor): TypeConverter<*>? {
    return cachedConverters[inputType.jClass]
  }
  private fun getCachedPrimitiveArrayConverter(typeDescriptor: TypeDescriptor): TypeConverter<*>? {
    return cachedPrimitiveArrayConverters[typeDescriptor.jClass]
  }

  override fun obtainTypeConverter(typeDescriptor: TypeDescriptor): TypeConverter<*> {
    val nonNullableTypeConverter = obtainNonNullableTypeConverter(typeDescriptor)
    return if (typeDescriptor.isNullable) {
      NullableTypeConverter(nonNullableTypeConverter)
    } else {
      nonNullableTypeConverter
    }
  }

  fun obtainNonNullableTypeConverter(typeDescriptor: TypeDescriptor): TypeConverter<*> {
    getCachedConverter(typeDescriptor)?.let {
      return it
    }

    val jClass = typeDescriptor.jClass

    if (jClass.isArray || Array::class.java.isAssignableFrom(jClass)) {
      return if (isPrimitiveArray(typeDescriptor)) {
        getCachedPrimitiveArrayConverter(typeDescriptor) ?: throw MissingTypeConverter(typeDescriptor)
      } else {
        ArrayTypeConverter(this, typeDescriptor)
      }
    }

    if (List::class.java.isAssignableFrom(jClass)) {
      return ListTypeConverter(this, typeDescriptor)
    }

    if (Map::class.java.isAssignableFrom(jClass)) {
      return MapTypeConverter(this, typeDescriptor)
    }

    if (Pair::class.java.isAssignableFrom(jClass)) {
      return PairTypeConverter(this, typeDescriptor)
    }

    if (Set::class.java.isAssignableFrom(jClass)) {
      return SetTypeConverter(this, typeDescriptor)
    }

    if (jClass.isEnum) {
      @Suppress("UNCHECKED_CAST")
      return EnumTypeConverter(jClass as Class<out Enum<*>>)
    }

    val cachedConverter = cachedRecordConverters[jClass]
    if (cachedConverter != null) {
      return cachedConverter
    }

    if (Record::class.java.isAssignableFrom(jClass)) {
      val converter = RecordTypeConverter<Record>(this, typeDescriptor)
      cachedRecordConverters[jClass] = converter
      return converter
    }

    if (View::class.java.isAssignableFrom(jClass)) {
      return ViewTypeConverter<View>(typeDescriptor)
    }

    if (SharedRef::class.java.isAssignableFrom(jClass)) {
      return SharedRefTypeConverter<SharedRef<*>>(typeDescriptor)
    }

    if (SharedObject::class.java.isAssignableFrom(jClass)) {
      return SharedObjectTypeConverter<SharedObject>(typeDescriptor)
    }

    if (JavaScriptFunction::class.java.isAssignableFrom(jClass)) {
      return JavaScriptFunctionTypeConverter<Any>(typeDescriptor)
    }

    if (ValueOrUndefined::class.java.isAssignableFrom(jClass)) {
      return ValueOrUndefinedTypeConverter(this, typeDescriptor)
    }

    return handelEither(typeDescriptor)
      ?: throw MissingTypeConverter(typeDescriptor)
  }

  private fun handelEither(typeDescriptor: TypeDescriptor): TypeConverter<*>? {
    val jClass = typeDescriptor.jClass
    if (Either::class.java.isAssignableFrom(jClass)) {
      if (EitherOfFour::class.java.isAssignableFrom(jClass)) {
        return EitherOfFourTypeConverter<Any, Any, Any, Any>(this, typeDescriptor)
      }
      if (EitherOfThree::class.java.isAssignableFrom(jClass)) {
        return EitherOfThreeTypeConverter<Any, Any, Any>(this, typeDescriptor)
      }
      return EitherTypeConverter<Any, Any>(this, typeDescriptor)
    }

    return null
  }

  private fun createCachedConverters(): Map<Class<*>, TypeConverter<*>> {
    val intTypeConverter = createTrivialTypeConverter(
      ExpectedType(CppType.INT)
    ) { it.asDouble().toInt() }
    val longTypeConverter = createTrivialTypeConverter(
      ExpectedType(CppType.LONG)
    ) { it.asDouble().toLong() }
    val doubleTypeConverter = createTrivialTypeConverter(
      ExpectedType(CppType.DOUBLE)
    ) { it.asDouble() }
    val floatTypeConverter = createTrivialTypeConverter(
      ExpectedType(CppType.FLOAT)
    ) { it.asDouble().toFloat() }
    val boolTypeConverter = createTrivialTypeConverter(
      ExpectedType(CppType.BOOLEAN)
    ) { it.asBoolean() }

    val serializableTypeConverter = SerializableTypeConverter()

    @Suppress("PLATFORM_CLASS_MAPPED_TO_KOTLIN")
    val converters = mapOf(
      Int::class.java to intTypeConverter,
      java.lang.Integer::class.java to intTypeConverter,

      Long::class.java to longTypeConverter,
      java.lang.Long::class.java to longTypeConverter,

      Double::class.java to doubleTypeConverter,
      java.lang.Double::class.java to doubleTypeConverter,

      Float::class.java to floatTypeConverter,
      java.lang.Float::class.java to floatTypeConverter,

      Boolean::class.java to boolTypeConverter,
      java.lang.Boolean::class.java to boolTypeConverter,

      String::class.java to createTrivialTypeConverter(
        ExpectedType(CppType.STRING)
      ) { it.asString() ?: throw DynamicCastException(String::class) },

      ReadableArray::class.java to createTrivialTypeConverter(
        ExpectedType(CppType.READABLE_ARRAY)
      ) { it.asArray() ?: throw DynamicCastException(ReadableArray::class) },
      ReadableMap::class.java to createTrivialTypeConverter(
        ExpectedType(CppType.READABLE_MAP)
      ) { it.asMap() ?: throw DynamicCastException(ReadableMap::class) },

      ByteArray::class.java to ByteArrayTypeConverter(),

      JavaScriptValue::class.java to createTrivialTypeConverter(
        ExpectedType(CppType.JS_VALUE)
      ),
      JavaScriptObject::class.java to createTrivialTypeConverter(
        ExpectedType(CppType.JS_OBJECT)
      ),
      JavaScriptArrayBuffer::class.java to createTrivialTypeConverter(
        ExpectedType(CppType.JS_ARRAY_BUFFER)
      ),
      NativeArrayBuffer::class.java to createTrivialTypeConverter(
        ExpectedType(CppType.NATIVE_ARRAY_BUFFER)
      ),

      Serializable::class.java to serializableTypeConverter,
      Worklet::class.java to WorkletTypeConverter(serializableTypeConverter),

      Int8Array::class.java to Int8ArrayTypeConverter(),
      Int16Array::class.java to Int16ArrayTypeConverter(),
      Int32Array::class.java to Int32ArrayTypeConverter(),
      Uint8Array::class.java to Uint8ArrayTypeConverter(),
      Uint8ClampedArray::class.java to Uint8ClampedArrayTypeConverter(),
      Uint16Array::class.java to Uint16ArrayTypeConverter(),
      Uint32Array::class.java to Uint32ArrayTypeConverter(),
      Float32Array::class.java to Float32ArrayTypeConverter(),
      Float64Array::class.java to Float64ArrayTypeConverter(),
      BigInt64Array::class.java to BigInt64ArrayTypeConverter(),
      BigUint64Array::class.java to BigUint64ArrayTypeConverter(),
      TypedArray::class.java to TypedArrayTypeConverter(),

      URL::class.java to URLTypConverter(),
      Uri::class.java to UriTypeConverter(),
      URI::class.java to JavaURITypeConverter(),

      File::class.java to FileTypeConverter(),

      Duration::class.java to DurationTypeConverter(),

      Any::class.java to AnyTypeConverter(),

      // Unit converter doesn't care about nullability.
      // It will always return Unit
      Unit::class.java to UnitTypeConverter(),

      ReadableArguments::class.java to ReadableArgumentsTypeConverter()
    )

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      return converters + mapOf(
        Path::class.java to PathTypeConverter(),
        Color::class.java to ColorTypeConverter(),
        LocalDate::class.java to DateTypeConverter()
      )
    }

    return converters
  }

  private fun createCachedPrimitiveArrayConverters(): Map<Class<*>, TypeConverter<*>> {
    return mapOf(
      IntArray::class.java to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.INT)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        IntArray(jsArray.size()) { index ->
          jsArray.getInt(index)
        }
      },
      LongArray::class.java to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.LONG)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        LongArray(jsArray.size()) { index ->
          jsArray.getDouble(index).toLong()
        }
      },
      DoubleArray::class.java to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.DOUBLE)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        DoubleArray(jsArray.size()) { index ->
          jsArray.getDouble(index)
        }
      },
      FloatArray::class.java to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.FLOAT)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        FloatArray(jsArray.size()) { index ->
          jsArray.getDouble(index).toFloat()
        }
      },
      BooleanArray::class.java to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.BOOLEAN)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        BooleanArray(jsArray.size()) { index ->
          jsArray.getBoolean(index)
        }
      }
    )
  }
}

class MergedTypeConverterProvider(
  private val providers: List<TypeConverterProvider>
) : TypeConverterProvider {
  override fun obtainTypeConverter(typeDescriptor: TypeDescriptor): TypeConverter<*> {
    for (provider in providers) {
      try {
        return provider.obtainTypeConverter(typeDescriptor)
      } catch (_: MissingTypeConverter) {
        // Ignore and try next provider
      }
    }

    throw MissingTypeConverter(typeDescriptor)
  }
}

fun TypeConverterProvider.mergeWith(otherProvider: TypeConverterProvider): TypeConverterProvider {
  return MergedTypeConverterProvider(listOf(this, otherProvider))
}

fun TypeConverterProvider?.mergeWithDefault(): TypeConverterProvider {
  return this?.mergeWith(TypeConverterProviderImpl) ?: TypeConverterProviderImpl
}
