package expo.modules.kotlin.allocators

import android.annotation.SuppressLint
import java.io.ObjectStreamClass
import kotlin.jvm.Throws

/**
 * Base on https://github.com/google/gson/blob/master/gson/src/main/java/com/google/gson/internal/UnsafeAllocator.java.
 */
fun interface UnsafeAllocator<T> {
  @Throws(Exception::class)
  fun newInstance(): T

  companion object {
    @SuppressLint("DiscouragedPrivateApi")
    @Suppress("UNCHECKED_CAST")
    fun <T> createAllocator(clazz: Class<T>): UnsafeAllocator<T> {
      // try DalvikVM
      try {
        val getConstructorId = ObjectStreamClass::class.java.getDeclaredMethod("getConstructorId", Class::class.java)
        getConstructorId.isAccessible = true
        val constructorId = getConstructorId.invoke(null, Object::class.java) as Int
        val newInstance = ObjectStreamClass::class.java.getDeclaredMethod("newInstance", Class::class.java, Int::class.java)
        newInstance.isAccessible = true
        return UnsafeAllocator {
          newInstance.invoke(null, clazz, constructorId) as T
        }
      } catch (_: Throwable) {
      }

      // try JVM (for unit tests)
      try {
        val unsafeClass = Class.forName("sun.misc.Unsafe")
        val theUnsafe = unsafeClass.getDeclaredField("theUnsafe")
        theUnsafe.isAccessible = true
        val unsafeObj = theUnsafe.get(null)
        val allocateInstance = unsafeClass.getMethod("allocateInstance", Class::class.java)
        return UnsafeAllocator {
          allocateInstance.invoke(unsafeObj, clazz) as T
        }
      } catch (_: Throwable) {
      }

      return UnsafeAllocator {
        throw IllegalArgumentException("Cannot allocate $clazz")
      }
    }
  }
}
