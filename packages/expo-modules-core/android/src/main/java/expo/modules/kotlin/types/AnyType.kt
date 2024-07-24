package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.ExpectedType
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

inline fun <reified T> (() -> KType).toAnyType() = AnyType(
  LazyKType(
    classifier = T::class,
    isMarkedNullable = null is T,
    kTypeProvider = this
  )
)

inline fun <reified T> toAnyType(): AnyType {
  return { typeOf<T>() }.toAnyType<T>()
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0> toArgsArray(
  p0: Class<P0> = P0::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>()
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(),
    toAnyType<P1>()
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(),
    toAnyType<P1>(),
    toAnyType<P2>()
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(),
    toAnyType<P1>(),
    toAnyType<P2>(),
    toAnyType<P3>()
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(),
    toAnyType<P1>(),
    toAnyType<P2>(),
    toAnyType<P3>(),
    toAnyType<P4>()
  )
}

@Suppress("UNUSED_PARAMETER")
inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> toArgsArray(
  p0: Class<P0> = P0::class.java,
  p1: Class<P1> = P1::class.java,
  p2: Class<P2> = P2::class.java,
  p3: Class<P3> = P3::class.java,
  p4: Class<P4> = P4::class.java,
  p5: Class<P5> = P5::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(),
    toAnyType<P1>(),
    toAnyType<P2>(),
    toAnyType<P3>(),
    toAnyType<P4>(),
    toAnyType<P5>()
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
  p6: Class<P6> = P6::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(),
    toAnyType<P1>(),
    toAnyType<P2>(),
    toAnyType<P3>(),
    toAnyType<P4>(),
    toAnyType<P5>(),
    toAnyType<P6>()
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
  p7: Class<P7> = P7::class.java
): Array<AnyType> {
  return arrayOf(
    toAnyType<P0>(),
    toAnyType<P1>(),
    toAnyType<P2>(),
    toAnyType<P3>(),
    toAnyType<P4>(),
    toAnyType<P5>(),
    toAnyType<P6>(),
    toAnyType<P7>()
  )
}

class AnyType(
  val kType: KType
) {

  private val converter: TypeConverter<*> by lazy {
    TypeConverterProviderImpl.obtainTypeConverter(kType)
  }

  fun convert(value: Any?, appContext: AppContext? = null): Any? = converter.convert(value, appContext)

  fun getCppRequiredTypes(): ExpectedType = converter.getCppRequiredTypes()

  internal inline fun <reified T> inheritFrom(): Boolean {
    val kClass = kType.classifier as? KClass<*> ?: return false
    val jClass = kClass.java

    return T::class.java.isAssignableFrom(jClass)
  }
}
