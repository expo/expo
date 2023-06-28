package abi49_0_0.expo.modules.kotlin.sharedobjects

import abi49_0_0.expo.modules.kotlin.AppContext
import abi49_0_0.expo.modules.kotlin.exception.InvalidSharedObjectException
import abi49_0_0.expo.modules.kotlin.jni.CppType
import abi49_0_0.expo.modules.kotlin.jni.ExpectedType
import abi49_0_0.expo.modules.kotlin.toStrongReference
import abi49_0_0.expo.modules.kotlin.types.NullAwareTypeConverter
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
