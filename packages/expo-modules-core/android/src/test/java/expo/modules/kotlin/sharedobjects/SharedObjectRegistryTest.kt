package expo.modules.kotlin.sharedobjects

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.InvalidSharedObjectIdException
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.runtime.Runtime
import io.mockk.mockk
import org.junit.Assert.assertThrows
import org.junit.Test
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import java.util.concurrent.atomic.AtomicReferenceArray
import kotlin.concurrent.thread
import kotlin.random.Random

class SharedObjectRegistryTest {
  private class TestSharedObject : SharedObject()

  private val jsWeakObject = mockk<JavaScriptWeakObject>()

  private fun createRegistry() = SharedObjectRegistry(mockk<Runtime>(relaxed = true))

  @Test
  fun `toNativeObject returns the object registered under the id`() {
    val registry = createRegistry()
    val sharedObject = TestSharedObject()
    register(registry, SharedObjectId(1), sharedObject)

    Truth.assertThat(registry.toNativeObject(SharedObjectId(1))).isSameInstanceAs(sharedObject)
  }

  @Test
  fun `toNativeObject throws for an id that was never registered`() {
    val registry = createRegistry()

    assertThrows(InvalidSharedObjectIdException::class.java) {
      registry.toNativeObject(SharedObjectId(5))
    }
  }

  @Test
  fun `toNativeObject throws for the unset id`() {
    val registry = createRegistry()

    assertThrows(InvalidSharedObjectIdException::class.java) {
      registry.toNativeObject(SharedObjectId(0))
    }
  }

  @Test
  fun `toNativeObject finds kept objects while another thread registers and releases objects`() {
    val failure = AtomicReference<Throwable>()

    repeat(ROUNDS) {
      if (failure.get() == null) {
        failure.set(lookUpKeptObjectsDuringChurn())
      }
    }

    Truth.assertThat(failure.get()).isNull()
  }

  // Even ids stay registered. Odd ids are released one step after they are registered,
  // as the JS garbage collector does with short-lived objects.
  private fun lookUpKeptObjectsDuringChurn(): Throwable? {
    val registry = createRegistry()
    val sharedObjects = AtomicReferenceArray<SharedObject>(OBJECTS_PER_ROUND + 1)
    val lastKeptId = AtomicInteger(0)
    val churning = AtomicBoolean(true)
    val failure = AtomicReference<Throwable>()

    val reader = thread {
      while (churning.get() && failure.get() == null) {
        val maxKeptId = lastKeptId.get()
        if (maxKeptId == 0) {
          continue
        }
        val id = Random.nextInt(1, maxKeptId / 2 + 1) * 2
        try {
          val found = registry.toNativeObject(SharedObjectId(id))
          check(found === sharedObjects.get(id)) { "Id $id resolved to another object" }
        } catch (e: Throwable) {
          failure.set(e)
        }
      }
    }

    for (id in 1..OBJECTS_PER_ROUND) {
      if (failure.get() != null) {
        break
      }
      val sharedObject = TestSharedObject()
      sharedObjects.set(id, sharedObject)
      register(registry, SharedObjectId(id), sharedObject)
      if (id % 2 == 0) {
        registry.delete(SharedObjectId(id - 1))
        lastKeptId.set(id)
      }
    }
    churning.set(false)
    reader.join()
    return failure.get()
  }

  // `add` needs a JS runtime, so this does only the map write that `add` does, under the same lock.
  private fun register(registry: SharedObjectRegistry, id: SharedObjectId, sharedObject: SharedObject) {
    synchronized(registry) {
      registry.pairs[id] = sharedObject to jsWeakObject
    }
  }

  private companion object {
    const val ROUNDS = 5
    const val OBJECTS_PER_ROUND = 500_000
  }
}
