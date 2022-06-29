package expo.modules.kotlin.jni

private var nextValue = 0

private fun nextValue(): Int = (1 shl nextValue).also { nextValue++ }

/**
 * Enum that represents Cpp types. Objects of those types can be obtained via JNI.
 */
enum class CppType(val value: Int) {
  NONE(0),
  DOUBLE(nextValue()),
  BOOLEAN(nextValue()),
  STRING(nextValue()),
  JS_OBJECT(nextValue()),
  JS_VALUE(nextValue()),
  READABLE_ARRAY(nextValue()),
  READABLE_MAP(nextValue());
}
