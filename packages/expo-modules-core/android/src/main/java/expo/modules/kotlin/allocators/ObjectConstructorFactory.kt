package expo.modules.kotlin.allocators

/**
 * This class was created based on https://github.com/google/gson/blob/master/gson/src/main/java/com/google/gson/internal/ConstructorConstructor.java.
 */
class ObjectConstructorFactory {
  fun <T> get(clazz: Class<T>): ObjectConstructor<T> {
    val defaultCtr = tryToUseDefaultConstructor(clazz)
    if (defaultCtr != null) {
      return defaultCtr
    }

    return useUnsafeAllocator(clazz)
  }

  private fun <T> tryToUseDefaultConstructor(clazz: Class<T>): ObjectConstructor<T>? {
    return try {
      val ctr = clazz.getDeclaredConstructor()
      if (!ctr.isAccessible) {
        ctr.isAccessible = true
      }

      ObjectConstructor {
        ctr.newInstance() as T
      }
    } catch (e: NoSuchMethodException) {
      null
    }
  }

  private fun <T> useUnsafeAllocator(clazz: Class<T>): ObjectConstructor<T> {
    val allocator = UnsafeAllocator.createAllocator(clazz)
    return ObjectConstructor {
      allocator.newInstance()
    }
  }
}
