package expo.modules.kotlin.jni

/**
 * The property descriptor options for the property being defined or modified.
 */
enum class JavaScriptObjectPropertyDescriptor(val value: Int) {
  /**
   * If set, the type of this property descriptor may be changed and if the property may be deleted from the corresponding object.
   */
  Configurable(1 shl 0),

  /**
   * If set, the property shows up during enumeration of the properties on the corresponding object.
   */
  Enumerable(1 shl 1),

  /**
   * If set, the value associated with the property may be changed with an assignment operator.
   */
  Writable(1 shl 2),
}
