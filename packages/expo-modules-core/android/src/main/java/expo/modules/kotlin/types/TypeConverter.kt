package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.NullArgumentException
import expo.modules.kotlin.jni.CppType

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
  fun convert(value: Any?): Type? {
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
   * Returns a list of C++ types that can be converted to the desired type.
   * Sometimes we have a choice between multiple representations of the same value.
   * For instance js object can be pass as [Map] or [expo.modules.kotlin.jni.JavaScriptObject].
   * This value tells us which one we should choose.
   */
  abstract fun getCppRequiredTypes(): List<CppType>
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
