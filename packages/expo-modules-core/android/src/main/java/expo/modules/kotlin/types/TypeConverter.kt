package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.NullArgumentException
import expo.modules.kotlin.exception.UnsupportedClass
import expo.modules.kotlin.jni.ExpectedType

/**
 * Basic type converter. It has to handle two different inputs - [Dynamic] and [Any].
 * The first one is used in the bridge implementation. The second one is used in the JSI.
 */
abstract class TypeConverter<Type : Any>(
  /**
   * Whether `null` can be assigned to the desired type.
   */
  private val isOptional: Boolean
) {
  /**
   * Tries to convert from [Any]? (can be also [Dynamic]) to the desired type.
   */
  open fun convert(value: Any?): Type? {
    if (value == null || value is Dynamic && value.isNull) {
      if (isOptional) {
        return null
      }
      throw NullArgumentException()
    }
    return convertNonOptional(value)
  }

  /**
   * Tries to convert from [Any] to the desired type.
   * We know in that place that we're not dealing with `null`.
   */
  abstract fun convertNonOptional(value: Any): Type

  /**
   * Returns a list of [ExpectedType] types that can be converted to the desired type.
   * Sometimes we have a choice between multiple representations of the same value.
   * For instance js object can be pass as [Map] or [expo.modules.kotlin.jni.JavaScriptObject].
   * This value tells us which one we should choose.
   */
  abstract fun getCppRequiredTypes(): ExpectedType

  /**
   * Checks if the current converter is a trivial one.
   * In that context, a trivial converter indicates a converter that in JSI implementation does nothing.
   * It should be true for most classes.
   */
  open fun isTrivial(): Boolean = true
}

/**
 * A helper class to make a clear separation between [Any] and [Dynamic].
 * Right it is used as a default base class for all converters, but this will change when we
 * stop using the bridge to pass data between JS and Kotlin.
 */
abstract class DynamicAwareTypeConverters<T : Any>(isOptional: Boolean) : TypeConverter<T>(isOptional) {
  override fun convertNonOptional(value: Any): T =
    if (value is Dynamic) {
      convertFromDynamic(value)
    } else {
      convertFromAny(value)
    }

  abstract fun convertFromDynamic(value: Dynamic): T
  abstract fun convertFromAny(value: Any): T
}

inline fun <reified T : Any> createTrivialTypeConverter(
  isOptional: Boolean,
  cppRequireType: ExpectedType,
  crossinline dynamicFallback: (Dynamic) -> T = { throw UnsupportedClass(T::class) }
): TypeConverter<T> {
  return object : DynamicAwareTypeConverters<T>(isOptional) {
    override fun convertFromDynamic(value: Dynamic): T = dynamicFallback(value)
    override fun getCppRequiredTypes(): ExpectedType = cppRequireType
    @Suppress("UNCHECKED_CAST")
    override fun convertFromAny(value: Any): T = value as T
  }
}
