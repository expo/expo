package expo.modules.kotlin.allocators

import kotlin.reflect.KClass
import kotlin.reflect.KParameter

/**
 * This class was created based on https://github.com/google/gson/blob/master/gson/src/main/java/com/google/gson/internal/ConstructorConstructor.java.
 */
class ObjectConstructorFactory {
  fun <T : Any> get(clazz: KClass<T>): ObjectConstructor<T> =
    tryToUseDefaultConstructor(clazz.java) ?: tryToUseDefaultKotlinConstructor(clazz)
      ?: useUnsafeAllocator(clazz.java)

  private fun <T> tryToUseDefaultConstructor(clazz: Class<T>): ObjectConstructor<T>? {
    return try {
      val ctor = clazz.getDeclaredConstructor()
      if (!ctor.isAccessible) {
        ctor.isAccessible = true
      }

      ObjectConstructor {
        ctor.newInstance() as T
      }
    } catch (e: NoSuchMethodException) {
      null
    }
  }

  private fun <T : Any> tryToUseDefaultKotlinConstructor(clazz: KClass<T>): ObjectConstructor<T>? {
    val noArgsConstructor = clazz.constructors.singleOrNull { it.parameters.all(KParameter::isOptional) }
      ?: return null
    return ObjectConstructor {
      noArgsConstructor.callBy(emptyMap())
    }
  }

  private fun <T> useUnsafeAllocator(clazz: Class<T>): ObjectConstructor<T> {
    val allocator = UnsafeAllocator.createAllocator(clazz)
    return ObjectConstructor {
      allocator.newInstance()
    }
  }
}
