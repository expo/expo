package expo.modules.kotlin.sharedobjects

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.IncorrectRefTypeException
import expo.modules.kotlin.exception.InvalidSharedObjectTypeException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.toStrongReference
import expo.modules.kotlin.types.NullAwareTypeConverter
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.KTypeProjection
import kotlin.reflect.full.isSuperclassOf

class SharedObjectTypeConverter<T : SharedObject>(
  val type: KType
) : NullAwareTypeConverter<T>(type.isMarkedNullable) {
  @Suppress("UNCHECKED_CAST")
  override fun convertNonOptional(value: Any, context: AppContext?): T {
    val id = SharedObjectId(
      if (value is Dynamic) {
        value.asInt()
      } else {
        value as Int
      }
    )

    val appContext = context.toStrongReference()
    val result = id.toNativeObject(appContext.hostingRuntimeContext)
    return result as T
  }

  override fun getCppRequiredTypes() = ExpectedType(CppType.SHARED_OBJECT_ID, CppType.INT)

  override fun isTrivial(): Boolean = false
}

class SharedRefTypeConverter<T : SharedRef<*>>(
  val type: KType
) : NullAwareTypeConverter<T>(type.isMarkedNullable) {
  private val sharedObjectTypeConverter = SharedObjectTypeConverter<T>(type)

  val sharedRefType: KType? by lazy {
    var currentClass: KClass<*>? = type.classifier as? KClass<*>
    var currentType: KType? = type
    while (currentClass != null) {
      if (currentClass == SharedRef::class) {
        val firstArgument = currentType?.arguments?.first()
        // If someone uses `SharedRef<*>` we can't determine the type.
        // In that case, the API will allow to pass any shared ref.
        if (firstArgument == KTypeProjection.STAR) {
          return@lazy null
        }

        return@lazy requireNotNull(firstArgument?.type) {
          "The $sharedRefType type should contain the type of the inner ref"
        }
      }
      currentType = currentClass.supertypes.firstOrNull()
      currentClass = currentType?.classifier as? KClass<*>
    }

    return@lazy null
  }

  override fun convertNonOptional(value: Any, context: AppContext?): T {
    val sharedObject = sharedObjectTypeConverter.convert(value, context)
    if (sharedObject !is SharedRef<*>) {
      throw InvalidSharedObjectTypeException(type)
    }

    @Suppress("UNCHECKED_CAST")
    return checkInnerRef(sharedObject) as T
  }

  private fun checkInnerRef(sharedRef: SharedRef<*>): SharedRef<*> {
    val ref = sharedRef.ref ?: return sharedRef
    val sharedRefClass = sharedRefType?.classifier as? KClass<*>
      ?: return sharedRef
    if (sharedRefClass.isSuperclassOf(ref.javaClass.kotlin)) {
      return sharedRef
    }

    throw IncorrectRefTypeException(type, sharedRef.javaClass)
  }

  override fun getCppRequiredTypes() = sharedObjectTypeConverter.getCppRequiredTypes()

  override fun isTrivial() = sharedObjectTypeConverter.isTrivial()
}
