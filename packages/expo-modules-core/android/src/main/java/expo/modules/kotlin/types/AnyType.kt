package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.types.descriptors.TypeDescriptor
import expo.modules.kotlin.types.descriptors.typeDescriptorOf

inline fun <reified T> toAnyType(converterProvider: TypeConverterProvider? = null): AnyType {
  val cachedAnyType = AnyTypeCache.cachedAnyType<T>()
  if (cachedAnyType != null) {
    return cachedAnyType
  }

  val typeDescriptor = typeDescriptorOf<T>()
  return AnyType(
    typeDescriptor = typeDescriptor,
    converterProvider = converterProvider
  )
}

class AnyType(
  val typeDescriptor: TypeDescriptor,
  val converterProvider: TypeConverterProvider? = null
) {
  private val converter: TypeConverter<*> by lazy {
    converterProvider?.obtainTypeConverter(typeDescriptor)
      ?: TypeConverterProviderImpl.obtainTypeConverter(typeDescriptor)
  }

  fun convert(value: Any?, appContext: AppContext? = null, forceConversion: Boolean = false): Any? {
    // We can skip conversion if we already did it on the C++ side.
    if (!forceConversion && converter.isTrivial() && value !is Dynamic) {
      return value
    }
    return converter.convert(value, appContext, forceConversion)
  }

  fun getCppRequiredTypes(): ExpectedType = converter.getCppRequiredTypes()
}

inline fun <reified T> AnyType.inheritFrom(): Boolean {
  val jClass = typeDescriptor.jClass
  return T::class.java.isAssignableFrom(jClass)
}
