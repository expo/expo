package expo.modules.kotlin.types

import android.net.Uri
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
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
import java.io.File
import java.net.URI
import java.net.URL
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.KTypeProjection
import kotlin.reflect.typeOf

class LazyKType(
  override val classifier: KClass<*>,
  override val isMarkedNullable: Boolean = false,
  val kTypeProvider: () -> KType
) : KType {
  private var _kType: KType? = null
  private val kType: KType
    get() {
      if (_kType == null) {
        _kType = kTypeProvider()
      }
      return _kType!!
    }

  override val annotations: List<Annotation>
    get() = kType.annotations
  override val arguments: List<KTypeProjection>
    get() = kType.arguments

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is LazyKType) return this.kType == other

    return classifier == other.classifier && isMarkedNullable == other.isMarkedNullable
  }

  override fun hashCode(): Int {
    var result = classifier.hashCode()
    result = 31 * result + isMarkedNullable.hashCode()
    return result
  }

  override fun toString(): String {
    return kType.toString()
  }
}

class EmptyKType(
  override val classifier: KClass<*>,
  override val isMarkedNullable: Boolean = false
) : KType {
  override val annotations: List<Annotation>
    get() = emptyList()
  override val arguments: List<KTypeProjection>
    get() = emptyList()

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is EmptyKType) return false

    return classifier == other.classifier && isMarkedNullable == other.isMarkedNullable
  }

  override fun hashCode(): Int {
    return 31 * classifier.hashCode() + isMarkedNullable.hashCode()
  }
}

object AnyTypeProvider {
  @PublishedApi
  internal val typesMap = buildMap<Pair<KClass<*>, Boolean>, AnyType> {
    listOf(
      Int::class,
      Float::class,
      Double::class,
      Long::class,
      Boolean::class,
      String::class,

      ByteArray::class,
      LongArray::class,
      IntArray::class,
      BooleanArray::class,
      FloatArray::class,
      DoubleArray::class,

      JavaScriptValue::class,
      JavaScriptObject::class,

      TypedArray::class,
      Int8Array::class,
      Int16Array::class,
      Int32Array::class,
      Uint8Array::class,
      Uint8ClampedArray::class,
      Uint16Array::class,
      Uint32Array::class,
      Float32Array::class,
      Float64Array::class,
      BigInt64Array::class,
      BigUint64Array::class,

      ReadableArray::class,
      ReadableMap::class,

      URL::class,
      Uri::class,
      URI::class,

      File::class,

      Any::class,
      Unit::class,

      ReadableArguments::class
    ).forEach { klass ->
      put((klass to false), AnyType(EmptyKType(klass, false)))
      put((klass to true), AnyType(EmptyKType(klass, true)))
    }
  }

  inline fun <reified T> cachedAnyType(): AnyType? {
    val key = Pair(T::class, null is T)
    return typesMap[key]
  }
}

inline fun <reified T> (() -> KType).toAnyType(converterProvider: TypeConverterProvider? = null) =
  AnyType(
    LazyKType(
      classifier = T::class,
      isMarkedNullable = null is T,
      kTypeProvider = this
    ),
    converterProvider
  )

inline fun <reified T> toAnyType(converterProvider: TypeConverterProvider? = null): AnyType {
  return AnyTypeProvider.cachedAnyType<T>() ?: { typeOf<T>() }.toAnyType<T>(converterProvider)
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0> toArgsArray(
  p0: Class<P0> = P0::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  p5: Class<P5> = P5::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider),
    toAnyType<P5>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  p5: Class<P5> = P5::class.java,
  p6: Class<P6> = P6::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider),
    toAnyType<P5>(converterProvider),
    toAnyType<P6>(converterProvider)
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  p5: Class<P5> = P5::class.java,
  p6: Class<P6> = P6::class.java,
  p7: Class<P7> = P7::class.java,
  converterProvider: TypeConverterProvider? = null
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(converterProvider),
    toAnyType<P1>(converterProvider),
    toAnyType<P2>(converterProvider),
    toAnyType<P3>(converterProvider),
    toAnyType<P4>(converterProvider),
    toAnyType<P5>(converterProvider),
    toAnyType<P6>(converterProvider),
    toAnyType<P7>(converterProvider)
  )
}

class AnyType(
  val kType: KType,
  val converterProvider: TypeConverterProvider? = null
) {

  private val converter: TypeConverter<*> by lazy {
    if (converterProvider != null) {
      converterProvider.obtainTypeConverter(kType)
    } else {
      TypeConverterProviderImpl.obtainTypeConverter(kType)
    }
  }

  fun convert(value: Any?, appContext: AppContext? = null): Any? =
    converter.convert(value, appContext)

  fun getCppRequiredTypes(): ExpectedType = converter.getCppRequiredTypes()

  internal inline fun <reified T> inheritFrom(): Boolean {
    val kClass = kType.classifier as? KClass<*> ?: return false
    val jClass = kClass.java

    return T::class.java.isAssignableFrom(jClass)
  }
}
