package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

/**
 * A Kotlin representation of jsi::Object.
 * Should be used only on the runtime thread.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
open class JavaScriptObject @DoNotStrip internal constructor(@DoNotStrip private val mHybridData: HybridData) {
  /**
   * The property descriptor options for the property being defined or modified.
   */
  enum class PropertyDescriptor(val value: Int) {
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

  external fun hasProperty(name: String): Boolean
  external fun getProperty(name: String): JavaScriptValue
  external fun getPropertyNames(): Array<String>

  private external fun setBoolProperty(name: String, value: Boolean)
  private external fun setDoubleProperty(name: String, value: Double)
  private external fun setStringProperty(name: String, value: String?)
  private external fun setJSValueProperty(name: String, value: JavaScriptValue?)
  private external fun setJSObjectProperty(name: String, value: JavaScriptObject?)
  private external fun unsetProperty(name: String)

  private external fun defineBoolProperty(name: String, value: Boolean, options: Int)
  private external fun defineDoubleProperty(name: String, value: Double, options: Int)
  private external fun defineStringProperty(name: String, value: String?, options: Int)
  private external fun defineJSValueProperty(name: String, value: JavaScriptValue?, options: Int)
  private external fun defineJSObjectProperty(name: String, value: JavaScriptObject?, options: Int)

  fun setProperty(name: String, value: Boolean) = setBoolProperty(name, value)
  fun setProperty(name: String, value: Int) = setDoubleProperty(name, value.toDouble())
  fun setProperty(name: String, value: Double) = setDoubleProperty(name, value)
  fun setProperty(name: String, value: String?) = setStringProperty(name, value)
  fun setProperty(name: String, value: JavaScriptValue?) = setJSValueProperty(name, value)
  fun setProperty(name: String, value: JavaScriptObject?) = setJSObjectProperty(name, value)

  // Needed to handle untyped null value
  // Without it setProperty(name, null) won't work
  fun setProperty(name: String, `null`: Nothing?) = unsetProperty(name)

  fun defineProperty(
    name: String,
    value: Boolean,
    options: List<PropertyDescriptor> = emptyList()
  ) = defineBoolProperty(name, value, options.toCppOptions())

  fun defineProperty(
    name: String,
    value: Int,
    options: List<PropertyDescriptor> = emptyList()
  ) = defineDoubleProperty(name, value.toDouble(), options.toCppOptions())

  fun defineProperty(
    name: String,
    value: Double,
    options: List<PropertyDescriptor> = emptyList()
  ) = defineDoubleProperty(name, value, options.toCppOptions())

  fun defineProperty(
    name: String,
    value: String?,
    options: List<PropertyDescriptor> = emptyList()
  ) = defineStringProperty(name, value, options.toCppOptions())

  fun defineProperty(
    name: String,
    value: JavaScriptValue?,
    options: List<PropertyDescriptor> = emptyList()
  ) = defineJSValueProperty(name, value, options.toCppOptions())

  fun defineProperty(
    name: String,
    value: JavaScriptObject?,
    options: List<PropertyDescriptor> = emptyList()
  ) = defineJSObjectProperty(name, value, options.toCppOptions())

  // Needed to handle untyped null value
  fun defineProperty(
    name: String,
    `null`: Nothing?,
    options: List<PropertyDescriptor> = emptyList()
  ) = defineJSObjectProperty(name, null, options.toCppOptions())

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }
}

private fun List<JavaScriptObject.PropertyDescriptor>.toCppOptions(): Int =
  fold(0) { acc, current ->
    acc or current.value
  }
