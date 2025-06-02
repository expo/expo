package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.NullArgumentException
import expo.modules.kotlin.exception.UnsupportedClass
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

/**
 * Basic type converter. It has to handle two different inputs - [Dynamic] and [Any].
 * The first one is used in the bridge implementation. The second one is used in the JSI.
 */
interface TypeConverter<Type : Any> {
  /**
   * Tries to convert from [Any]? (can be also [Dynamic]) to the desired type.
   */
  fun convert(value: Any?, context: AppContext? = null, forceConversion: Boolean = false): Type?

  /**
   * Returns a list of [ExpectedType] types that can be converted to the desired type.
   * Sometimes we have a choice between multiple representations of the same value.
   * For instance js object can be pass as [Map] or [expo.modules.kotlin.jni.JavaScriptObject].
   * This value tells us which one we should choose.
   */
  fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.ANY)

  /**
   * Checks if the current converter is a trivial one.
   * In that context, a trivial converter indicates a converter that in JSI implementation does nothing.
   * It should be true for most classes.
   */
  fun isTrivial(): Boolean = true
}

abstract class NonNullableTypeConverter<Type : Any>() : TypeConverter<Type> {
  override fun convert(value: Any?, context: AppContext?, forceConversion: Boolean): Type {
    return convertNonNullable(value ?: throw NullArgumentException(), context, forceConversion)
  }

  abstract fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): Type
}

/**
 * A helper class to make a clear separation between [Any] and [Dynamic].
 * Right it is used as a default base class for all converters, but this will change when we
 * stop using the bridge to pass data between JS and Kotlin.
 */
abstract class DynamicAwareTypeConverters<T : Any>() : NonNullableTypeConverter<T>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): T =
    if (value is Dynamic) {
      convertFromDynamic(value, context, forceConversion)
    } else {
      convertFromAny(value, context, forceConversion)
    }

  abstract fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): T
  abstract fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): T
}

inline fun <reified T : Any> createTrivialTypeConverter(
  cppRequireType: ExpectedType,
  crossinline dynamicFallback: (Dynamic) -> T = { throw UnsupportedClass(T::class) }
): TypeConverter<T> {
  return object : DynamicAwareTypeConverters<T>() {
    override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): T {
      return dynamicFallback(value)
    }

    override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): T {
      return value as T
    }

    override fun getCppRequiredTypes(): ExpectedType = cppRequireType
  }
}
