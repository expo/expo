package expo.modules.kotlin.jni

import expo.modules.core.interfaces.DoNotStrip
import java.lang.ref.PhantomReference
import java.lang.ref.ReferenceQueue
import java.lang.ref.WeakReference

@DoNotStrip
interface Destructible {
  fun deallocate()
}

@DoNotStrip
class JNIDeallocator(shouldCreateDestructorThread: Boolean = true) {
  /**
   * A [PhantomReference] queue managed by JVM
   */
  private val referenceQueue = ReferenceQueue<Destructible>()

  /**
   * A registry to keep all active [Destructible] objects and their [PhantomReference]s
   */
  private val destructorMap = mutableMapOf<PhantomReference<Destructible>, WeakReference<Destructible>>()

  /**
   * A thread that clears your registry when an object has been garbage collected
   * to not store invalid references to every created object.
   */
  private val destructorThread = if (shouldCreateDestructorThread) {
    object : Thread("Expo JNI deallocator") {
      override fun run() {
        while (!isInterrupted) {
          try {
            // Referent of PhantomReference were garbage collected so we can remove it from our registry.
            // Note that we don't have to call `deallocate` method - it was called [com.facebook.jni.HybridData].
            val current = referenceQueue.remove()
            synchronized(this) {
              destructorMap.remove(current)
            }
          } catch (e: InterruptedException) {
            return
          }
        }
      }
    }.also {
      it.start()
    }
  } else {
    null
  }

  /**
   * Adds reference to the internal registry.
   * That reference will be deallocated when [JNIDeallocator.deallocate] is called or
   * when the reference won't be reachable by the GC.
   */
  @DoNotStrip
  fun addReference(destructible: Destructible): Unit = synchronized(this) {
    val weakRef = WeakReference(destructible)
    val phantomRef = PhantomReference(destructible, referenceQueue)
    destructorMap[phantomRef] = weakRef
  }

  /**
   * Deallocates valid references and clears the internal registry.
   */
  internal fun deallocate() = synchronized(this) {
    destructorMap.values.forEach {
      it.get()?.deallocate()
    }
    destructorMap.clear()
    destructorThread?.interrupt()
  }

  /**
   * Returns references to all hybrid objects that contain references to the jsi value
   * and are present in the memory.
   */
  fun inspectMemory() = synchronized(this) {
    destructorMap.values.mapNotNull { it.get() }
  }
}
