package expo.modules.kotlin.jni

private var nextValue = 0

private fun nextValue(): Int {
  val result = 1 shl nextValue
  nextValue++
  return result
}

/**
 * Enum that represents a Cpp types. Those types can be obtain via JNI.
 */
enum class CppType(private val value: Int) {
  DOUBLE(nextValue()),
  BOOLEAN(nextValue()),
  STRING(nextValue()),
  JS_OBJECT(nextValue()),
  JS_VALUE(nextValue()),
  READABLE_ARRAY(nextValue()),
  READABLE_MAP(nextValue());

  fun toValue(): Int = value
}
