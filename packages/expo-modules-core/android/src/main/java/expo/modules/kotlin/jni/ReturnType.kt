package expo.modules.kotlin.jni

private var nextValue = 0

private fun nextValue(): Int = (1 shl nextValue).also { nextValue++ }

// Keep this in sync with  C++ enum in `ReturnType.h`.
enum class ReturnType(val value: Int = nextValue()) {
  UNKNOWN(0),
  DOUBLE,
  INT,
  LONG,
  STRING,
  BOOLEAN,
  FLOAT,
  WRITEABLE_ARRAY,
  WRITEABLE_MAP,
  JS_MODULE,
  SHARED_OBJECT,
  JS_TYPED_ARRAY,
  JS_ARRAY_BUFFER,
  NATIVE_ARRAY_BUFFER,
  MAP,
  COLLECTION,
  DOUBLE_ARRAY,
  INT_ARRAY,
  LONG_ARRAY,
  FLOAT_ARRAY,
  BOOLEAN_ARRAY
}
