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
