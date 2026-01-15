package expo.modules.kotlin.types.worklets

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.worklets.Serializable
import expo.modules.kotlin.jni.worklets.Worklet
import expo.modules.kotlin.types.NonNullableTypeConverter
import expo.modules.kotlin.types.TypeConverter

class WorkletTypeConverter(
  private val serializableTypeConverter: TypeConverter<Serializable>
) : NonNullableTypeConverter<Worklet>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): Worklet {
    val serializable = serializableTypeConverter.convert(value, context, forceConversion)
      ?: throw IllegalArgumentException("Cannot convert '$value' to Serializable.")
    if (serializable.type != Serializable.ValueType.Worklet) {
      throw IllegalArgumentException("Expected Serializable of type Worklet but got ${serializable.type}.")
    }

    return Worklet(serializable)
  }
  override fun getCppRequiredTypes() = serializableTypeConverter.getCppRequiredTypes()
  override fun isTrivial() = false
}
