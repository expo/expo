package expo.modules.kotlin.jni

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

class PromiseImplTest {
  @Test
  fun `settles once when rejected while a resolve is in progress`() {
    val resolveStarted = CountDownLatch(1)
    val finishResolve = CountDownLatch(1)
    val callback = mockk<JavaCallback>(relaxed = true) {
      every { this@mockk.invoke(any<String>()) } answers {
        resolveStarted.countDown()
        finishResolve.await(5, TimeUnit.SECONDS)
      }
    }
    val promise = PromiseImpl(callback)

    val resolver = thread { promise.resolve("value") }
    resolveStarted.await(5, TimeUnit.SECONDS)
    promise.reject("ERR_TEST", "rejected while resolving", null)
    finishResolve.countDown()
    resolver.join()

    verify(exactly = 1) { callback.invoke(any<String>()) }
    verify(exactly = 0) { callback.invoke(any<String>(), any<String>()) }
  }

  @Test
  fun `can still be rejected after a resolve throws`() {
    val callback = mockk<JavaCallback>(relaxed = true) {
      every { this@mockk.invoke(any<String>()) } throws IllegalStateException("conversion failed")
    }
    val promise = PromiseImpl(callback)

    assertThrows(IllegalStateException::class.java) { promise.resolve("value") }

    assertFalse(promise.wasSettled)
    promise.reject("ERR_TEST", "conversion failed", null)
    verify(exactly = 1) { callback.invoke("ERR_TEST", "conversion failed") }
  }
}
