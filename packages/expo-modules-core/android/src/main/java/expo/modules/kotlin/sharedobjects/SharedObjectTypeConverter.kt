package expo.modules.kotlin.sharedobjects

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.InvalidSharedObjectException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.toStrongReference
import expo.modules.kotlin.types.NullAwareTypeConverter
import kotlin.reflect.KType

class SharedObjectTypeConverter<T : SharedObject>(
  val type: KType
) : NullAwareTypeConverter<T>(type.isMarkedNullable) {
  @Suppress("UNCHECKED_CAST")
  override fun convertNonOptional(value: Any, context: AppContext?): T {
    val id = SharedObjectId(value as Int)
    val appContext = context.toStrongReference()
    val result = appContext.sharedObjectRegistry.toNativeObject(id)
      ?: throw InvalidSharedObjectException(type)

    return result as T
  }

  override fun getCppRequiredTypes() = ExpectedType(CppType.SHARED_OBJECT_ID)

  override fun isTrivial(): Boolean = false
}
