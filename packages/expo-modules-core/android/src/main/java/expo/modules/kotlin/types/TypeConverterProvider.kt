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
import kotlin.reflect.KClass
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

  private val cachedRecordConverters = mutableMapOf<KType, TypeConverter<*>>()

  private fun getCachedConverter(inputType: TypeDescriptor): TypeConverter<*>? {
    return cachedConverters[inputType.kClass]
  }
  private fun getCachedPrimitiveArrayConverter(typeDescriptor: TypeDescriptor): TypeConverter<*>? {
    return cachedPrimitiveArrayConverters[typeDescriptor.kClass]
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

    val kClass = typeDescriptor.kClass
    val jClass = kClass.java

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
      return EnumTypeConverter(kClass as KClass<Enum<*>>)
    }

    val cachedConverter = cachedRecordConverters[typeDescriptor.kType]
    if (cachedConverter != null) {
      return cachedConverter
    }

    if (Record::class.java.isAssignableFrom(jClass)) {
      val converter = RecordTypeConverter<Record>(this, typeDescriptor)
      cachedRecordConverters[typeDescriptor.kType] = converter
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
    val jClass = typeDescriptor.kClass.java
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

  private fun createCachedConverters(): Map<KClass<*>, TypeConverter<*>> {
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
        ExpectedType(CppType.STRING)
      ) { it.asString() ?: throw DynamicCastException(String::class) },

      ReadableArray::class to createTrivialTypeConverter(
        ExpectedType(CppType.READABLE_ARRAY)
      ) { it.asArray() ?: throw DynamicCastException(ReadableArray::class) },
      ReadableMap::class to createTrivialTypeConverter(
        ExpectedType(CppType.READABLE_MAP)
      ) { it.asMap() ?: throw DynamicCastException(ReadableMap::class) },

      ByteArray::class to ByteArrayTypeConverter(),

      JavaScriptValue::class to createTrivialTypeConverter(
        ExpectedType(CppType.JS_VALUE)
      ),
      JavaScriptObject::class to createTrivialTypeConverter(
        ExpectedType(CppType.JS_OBJECT)
      ),
      JavaScriptArrayBuffer::class to createTrivialTypeConverter(
        ExpectedType(CppType.JS_ARRAY_BUFFER)
      ),
      NativeArrayBuffer::class to createTrivialTypeConverter(
        ExpectedType(CppType.NATIVE_ARRAY_BUFFER)
      ),

      Serializable::class to serializableTypeConverter,
      Worklet::class to WorkletTypeConverter(serializableTypeConverter),

      Int8Array::class to Int8ArrayTypeConverter(),
      Int16Array::class to Int16ArrayTypeConverter(),
      Int32Array::class to Int32ArrayTypeConverter(),
      Uint8Array::class to Uint8ArrayTypeConverter(),
      Uint8ClampedArray::class to Uint8ClampedArrayTypeConverter(),
      Uint16Array::class to Uint16ArrayTypeConverter(),
      Uint32Array::class to Uint32ArrayTypeConverter(),
      Float32Array::class to Float32ArrayTypeConverter(),
      Float64Array::class to Float64ArrayTypeConverter(),
      BigInt64Array::class to BigInt64ArrayTypeConverter(),
      BigUint64Array::class to BigUint64ArrayTypeConverter(),
      TypedArray::class to TypedArrayTypeConverter(),

      URL::class to URLTypConverter(),
      Uri::class to UriTypeConverter(),
      URI::class to JavaURITypeConverter(),

      File::class to FileTypeConverter(),

      Duration::class to DurationTypeConverter(),

      Any::class to AnyTypeConverter(),

      // Unit converter doesn't care about nullability.
      // It will always return Unit
      Unit::class to UnitTypeConverter(),

      ReadableArguments::class to ReadableArgumentsTypeConverter()
    )

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      return converters + mapOf(
        Path::class to PathTypeConverter(),
        Color::class to ColorTypeConverter(),
        LocalDate::class to DateTypeConverter()
      )
    }

    return converters
  }

  private fun createCachedPrimitiveArrayConverters(): Map<KClass<*>, TypeConverter<*>> {
    return mapOf(
      IntArray::class to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.INT)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        IntArray(jsArray.size()) { index ->
          jsArray.getInt(index)
        }
      },
      LongArray::class to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.LONG)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        LongArray(jsArray.size()) { index ->
          jsArray.getDouble(index).toLong()
        }
      },
      DoubleArray::class to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.DOUBLE)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        DoubleArray(jsArray.size()) { index ->
          jsArray.getDouble(index)
        }
      },
      FloatArray::class to createTrivialTypeConverter(
        ExpectedType.forPrimitiveArray(CppType.FLOAT)
      ) {
        val jsArray = it.asArray() ?: throw DynamicCastException(ReadableArray::class)
        FloatArray(jsArray.size()) { index ->
          jsArray.getDouble(index).toFloat()
        }
      },
      BooleanArray::class to createTrivialTypeConverter(
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
