package expo.modules.kotlin.jni

private var nextValue = 0

private fun nextValue(): Int = (1 shl nextValue).also { nextValue++ }

/**
 * Enum that represents Cpp types. Objects of those types can be obtained via JNI.
 */
enum class CppType(val value: Int = nextValue()) {
  NONE(0),
  DOUBLE,
  INT,
  FLOAT,
  BOOLEAN,
  STRING,
  JS_OBJECT,
  JS_VALUE,
  READABLE_ARRAY,
  READABLE_MAP,
  TYPED_ARRAY;
}
