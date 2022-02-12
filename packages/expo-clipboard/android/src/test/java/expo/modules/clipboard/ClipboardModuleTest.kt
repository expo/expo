package expo.modules.clipboard

import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import androidx.test.core.app.ApplicationProvider
import expo.modules.test.core.ModuleMock
import expo.modules.test.core.PromiseState
import expo.modules.test.core.assertResolved
import expo.modules.test.core.promiseResolved
import io.mockk.confirmVerified
import io.mockk.verify

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.P]) // API 28
class ClipboardModuleTest {

  private lateinit var module: ModuleMock<ClipboardModule>

  @Before
  fun initializeMock() {
    module = ModuleMock(ClipboardModule(), autoOnCreate = true)
  }

  @Test
  fun `should save to and read from clipboard`() {
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
  fun `should get empty string when clipboard is empty`() {
    // This requires API 28
    clipboardManager.clearPrimaryClip()

    val promise = module.callFunction("getStringAsync")

    promiseResolved<String>(promise) { resolvedValue ->
      assertTrue("Clipboard content should be empty", resolvedValue.isEmpty())
    }
  }

  @Test
  fun `should emit events when clipboard changes`() {
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
  fun `shouldn't emit events when in background`() {
    // prepare
    module.activityGoesBackground()

    // update clipboard content
    module.callFunction("setString", "ronald weasley")

    // assert that event was NOT called
    verify(inverse = true) { module.eventEmitter.emit("setString", any()) }
    confirmVerified(module.eventEmitter)
  }

  private val clipboardManager: ClipboardManager
    get() = ApplicationProvider
      .getApplicationContext<Context>()
      .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
}
