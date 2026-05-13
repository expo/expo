package expo.modules.kotlin.sharedobjects

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.IncorrectRefTypeException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.toStrongReference
import expo.modules.kotlin.types.NonNullableTypeConverter
import expo.modules.kotlin.types.descriptors.TypeDescriptor

class SharedObjectTypeConverter<T : SharedObject>(
  val typeDescriptor: TypeDescriptor
) : NonNullableTypeConverter<T>() {
  @Suppress("UNCHECKED_CAST")
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): T {
    val id = SharedObjectId(
      if (value is Dynamic) {
        value.asInt()
      } else {
        value as Int
      }
    )

    val appContext = context.toStrongReference()
    val result = id.toNativeObject(appContext.runtime)
    return result as T
  }

  override fun getCppRequiredTypes() = ExpectedType(CppType.SHARED_OBJECT_ID, CppType.INT)

  override fun isTrivial(): Boolean = false
}

class SharedRefTypeConverter<T : SharedRef<*>>(
  val typeDescriptor: TypeDescriptor
) : NonNullableTypeConverter<T>() {
  private val sharedObjectTypeConverter = SharedObjectTypeConverter<T>(typeDescriptor)

  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): T {
    val sharedObject = sharedObjectTypeConverter.convert(value, context, forceConversion)

    if (!checkType(sharedObject)) {
      throw IncorrectRefTypeException(typeDescriptor, sharedObject::class.java)
    }

    return sharedObject
  }

  private fun checkType(sharedRef: SharedRef<*>): Boolean {
    if (typeDescriptor.jClass == SharedRef::class.java) {
      val param = typeDescriptor.params.first()
      // If someone uses `SharedRef<*>` we can't determine the type.
      // In that case, the API will allow to pass any shared ref.
      if (param.isStar) {
        return true
      }

      return param.jClass.isAssignableFrom(sharedRef.ref::class.java)
    }

    return typeDescriptor.jClass.isAssignableFrom(sharedRef::class.java)
  }

  override fun getCppRequiredTypes() = sharedObjectTypeConverter.getCppRequiredTypes()

  override fun isTrivial() = sharedObjectTypeConverter.isTrivial()
}
