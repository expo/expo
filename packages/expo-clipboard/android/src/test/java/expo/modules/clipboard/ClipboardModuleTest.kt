package expo.modules.clipboard

import expo.modules.test.core.ModuleMock
import expo.modules.test.core.PromiseState
import expo.modules.test.core.assertResolved
import expo.modules.test.core.promiseResolved
import io.mockk.confirmVerified
import io.mockk.verify

import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ClipboardModuleTest {

  private lateinit var module: ModuleMock<ClipboardModule>

  @Before
  fun initializeMock() {
    module = ModuleMock(ClipboardModule(), autoOnCreate = true)
  }

  @Test
  fun `save to and read from clipboard`() {
    // write to clipboard
    val writePromise = module.callFunction("setString", "albus dumbledore")
    assertResolved(writePromise)

    // read from clipboard
    val readPromise = module.callFunction("getStringAsync")
    promiseResolved<String>(readPromise) { resolvedValue ->
      assertEquals("albus dumbledore", resolvedValue)
    }
  }

  @Test
  fun `emit events when clipboard changes`() {
    // update clipboard content
    val promise1 = module.callFunction("setString", "severus snape")
    assertEquals(promise1.state, PromiseState.RESOLVED)

    // assert
    verify {
      module.eventEmitter.emit(
        "onClipboardChanged",
        match {
          it.getString("content") == "severus snape"
        }
      )
    }
    confirmVerified(module.eventEmitter)
  }

  @Test
  fun `don't emit events when in background`() {
    // prepare
    module.activityGoesBackground()

    // update clipboard content
    module.callFunction("setString", "ronald weasley")

    // assert that event was NOT called
    verify(inverse = true) { module.eventEmitter.emit("setString", any()) }
    confirmVerified(module.eventEmitter)
  }
}
