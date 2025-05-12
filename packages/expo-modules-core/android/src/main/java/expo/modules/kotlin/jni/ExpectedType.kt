package expo.modules.kotlin.jni

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.MissingTypeConverter
import kotlin.reflect.KClass
import kotlin.reflect.KType

/**
 * A basic class that represents metadata about the expected type.
 */
@DoNotStrip
class SingleType(
  internal val expectedCppType: CppType,
  /**
   * Types of generic parameters.
   */
  private val parameterTypes: Array<ExpectedType>? = null
) {
  /**
   * The representation of the type.
   */
  @DoNotStrip
  fun getCppType() = expectedCppType.value

  /**
   * A convenient property to return the type of the first parameter.
   */
  @DoNotStrip
  fun getFirstParameterType() = parameterTypes?.get(0)

  /**
   * A convenient property to return the type of the second parameter.
   */
  @DoNotStrip
  fun getSecondParameterType() = parameterTypes?.get(1)
}

/**
 * A class representing an expected type returned from the Cpp to the Kotlin.
 * For instance [Pair] class can be represented as an object with two properties or an array of two elements.
 * In that case, the ExpectedType will be a combination of [com.facebook.react.bridge.ReadableArray] and [com.facebook.react.bridge.ReadableMap].
 */
@DoNotStrip
class ExpectedType(
  private vararg val innerPossibleTypes: SingleType
) {
  constructor(vararg expectedTypes: CppType) : this(*expectedTypes.map { SingleType(it) }.toTypedArray())

  /**
   * A convenient property to return combined int value of expected types.
   */
  private val innerCombinedTypes: Int = innerPossibleTypes.fold(0) { acc, current -> acc or current.getCppType() }

  // Needed by JNI
  @DoNotStrip
  fun getCombinedTypes() = innerCombinedTypes

  // Needed by JNI
  @DoNotStrip
  fun getPossibleTypes() = innerPossibleTypes

  // Needed by JNI
  @DoNotStrip
  fun getFirstType() = innerPossibleTypes.first()

  operator fun plus(other: ExpectedType): ExpectedType {
    return ExpectedType(
      *this.innerPossibleTypes,
      *other.innerPossibleTypes
    )
  }

  override operator fun equals(other: Any?): Boolean {
    if (other !is ExpectedType) return false

    if (this.innerPossibleTypes.size != other.innerPossibleTypes.size) return false
    for (i in this.innerPossibleTypes.indices) {
      if (this.innerPossibleTypes[i].expectedCppType != other.innerPossibleTypes[i].expectedCppType) {
        return false
      }
      if (this.innerPossibleTypes[i].getFirstParameterType() != other.innerPossibleTypes[i].getFirstParameterType()) {
        return false
      }
    }
    return true
  }

  companion object {
    fun forPrimitiveArray(parameterType: CppType) = ExpectedType(
      SingleType(CppType.PRIMITIVE_ARRAY, arrayOf(ExpectedType(parameterType)))
    )

    fun forPrimitiveArray(parameterType: ExpectedType) = ExpectedType(
      SingleType(CppType.PRIMITIVE_ARRAY, arrayOf(parameterType))
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

    fun fromKType(type: KType): ExpectedType {
      val kClass = type.classifier as? KClass<*> ?: throw IllegalArgumentException("...")
      if (Int::class == kClass) {
        return ExpectedType(SingleType(CppType.INT))
      }
      if (Long::class == kClass) {
        return ExpectedType(SingleType(CppType.LONG))
      }
      if (Double::class == kClass) {
        return ExpectedType(SingleType(CppType.DOUBLE))
      }
      if (Float::class == kClass) {
        return ExpectedType(SingleType(CppType.FLOAT))
      }
      if (Boolean::class == kClass) {
        return ExpectedType(SingleType(CppType.BOOLEAN))
      }
      if (String::class == kClass) {
        return ExpectedType(SingleType(CppType.STRING))
      }
      if (kClass.java.isAssignableFrom(List::class.java)) {
        val argType = type.arguments.firstOrNull()?.type
        if (argType != null) {
          return forList(fromKType(argType))
        }
      }
      if (kClass.java.isAssignableFrom(Map::class.java)) {
        val argType = type.arguments.getOrNull(1)?.type
        if (argType != null) {
          return forMap(fromKType(argType))
        }
      }
      throw MissingTypeConverter(type)
    }
  }
}
