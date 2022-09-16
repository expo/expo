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

  /**
   * A convenient property to return the type of the first parameter.
   */
  val firstParameterType get() = parameterTypes?.get(0)

  /**
   * A convenient property to return the type of the second parameter.
   */
  val secondParameterType get() = parameterTypes?.get(1)
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

  /**
   * A convenient property to return the first of possible types.
   */
  val firstType = possibleTypes.first()

  companion object {
    fun forPrimitiveArray(parameterType: CppType) = ExpectedType(
      SingleType(CppType.PRIMITIVE_ARRAY, arrayOf(ExpectedType(parameterType)))
    )

    fun forPrimitiveArray(parameterType: ExpectedType) = ExpectedType(
      SingleType(CppType.PRIMITIVE_ARRAY, arrayOf(parameterType))
    )

    // We are not using all types here to provide a similar behaviour to the bridge implementation
    fun forAny() = ExpectedType(
      CppType.READABLE_MAP,
      CppType.READABLE_ARRAY,
      CppType.STRING,
      CppType.BOOLEAN,
      CppType.DOUBLE
    )

    fun forEnum() = ExpectedType(
      CppType.STRING,
      CppType.INT
    )

    fun forList(parameterType: CppType) = ExpectedType(
      SingleType(CppType.LIST, arrayOf(ExpectedType(parameterType)))
    )

    fun forList(parameterType: ExpectedType) = ExpectedType(
      SingleType(CppType.LIST, arrayOf(parameterType))
    )

    fun forMap(valueType: CppType) = ExpectedType(
      SingleType(CppType.MAP, arrayOf(ExpectedType(valueType)))
    )

    fun forMap(valueType: ExpectedType) = ExpectedType(
      SingleType(CppType.MAP, arrayOf(valueType))
    )
  }
}
