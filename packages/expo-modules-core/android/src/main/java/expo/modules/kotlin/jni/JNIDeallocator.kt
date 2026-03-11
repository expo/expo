package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import java.lang.ref.PhantomReference
import java.lang.ref.ReferenceQueue

@DoNotStrip
interface Destructible {
  fun getHybridDataForJNIDeallocator(): HybridData
}

@DoNotStrip
class JNIDeallocator(shouldCreateDestructorThread: Boolean = true) : AutoCloseable {
  private inner class DeallocatorThread : Thread("Expo JNI deallocator") {
    override fun run() = deallocator()
  }

  /**
   * A [PhantomReference] queue managed by JVM
   */
  private val referenceQueue = ReferenceQueue<Destructible>()

  /**
   * A registry to keep all active [Destructible] objects and their [PhantomReference]s
   */
  private val destructorMap = mutableMapOf<PhantomReference<Destructible>, HybridData>()

  /**
   * A thread that clears your registry when an object has been garbage collected
   * to not store invalid references to every created object.
   */
  private val destructorThread = if (shouldCreateDestructorThread) {
    DeallocatorThread().apply { start() }
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
    val phantomRef = PhantomReference(destructible, referenceQueue)
    destructorMap[phantomRef] = destructible.getHybridDataForJNIDeallocator()
  }

  /**
   * Deallocates valid references and clears the internal registry.
   */
  internal fun deallocate() = synchronized(this) {
    destructorMap.values.forEach {
      it.resetNative()
    }
    destructorMap.clear()
    destructorThread?.interrupt()
  }

  /**
   * Returns references to all hybrid objects that contain references to the jsi value
   * and are present in the memory.
   */
  fun inspectMemory() = synchronized(this) {
    destructorMap
      .values
      .filter { synchronized(it) { it.isValid } }
      .map { it }
  }

  private fun Thread.deallocator() {
    while (!isInterrupted) {
      try {
        val current = referenceQueue.remove()
        destructorMap[current]?.resetNative()
        synchronized(this@JNIDeallocator) {
          destructorMap.remove(current)
        }
      } catch (_: InterruptedException) {
        return
      }
    }
  }

  override fun close() {
    deallocate()
  }
}
