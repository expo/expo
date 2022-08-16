package expo.modules.kotlin.jni

import expo.modules.core.interfaces.DoNotStrip

/**
 * A basic class that represents metadata about the expected type.
 */
@DoNotStrip
class SingleType(
  expectedCppType: CppType,
  /**
   * Types of generic parameters.
   */
  val parameterTypes: Array<ExpectedType>? = null
) {
  /**
   * The representation of the type.
   */
  val cppType: Int = expectedCppType.value
}

/**
 * A class representing an expected type returned from the Cpp to the Kotlin.
 * For instance [Pair] class can be represented as an object with two properties or an array of two elements.
 * In that case, the ExpectedType will be a combination of [com.facebook.react.bridge.ReadableArray] and [com.facebook.react.bridge.ReadableMap].
 */
@DoNotStrip
class ExpectedType(
  vararg val possibleTypes: SingleType
) {
  constructor(vararg expectedTypes: CppType) : this(*expectedTypes.map { SingleType(it) }.toTypedArray())

  /**
   * A convenient property to return combined int value of expected types.
   */
  val combinedTypes: Int = possibleTypes.fold(0) { acc, current -> acc or current.cppType }
}
