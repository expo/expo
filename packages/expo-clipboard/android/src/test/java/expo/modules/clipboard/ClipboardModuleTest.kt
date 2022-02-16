package expo.modules.clipboard

import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import androidx.test.core.app.ApplicationProvider
import expo.modules.kotlin.exception.CodedException
import expo.modules.test.core.ModuleMock
import expo.modules.test.core.PromiseState
import expo.modules.test.core.assertResolved
import expo.modules.test.core.promiseResolved
import io.mockk.confirmVerified
import io.mockk.verify

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements
import org.robolectric.shadows.ShadowContextImpl

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
        clipboardChangedEventName,
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

    // assert that emit() was NOT called
    verify(inverse = true) { module.eventEmitter.emit(clipboardChangedEventName, any()) }
    confirmVerified(module.eventEmitter)
  }

  @Test
  @Config(shadows = [ContextWithoutClipboardService::class])
  fun `should throw when ClipboardManager is unavailable`() {
    val exception = runCatching { module.callFunction("getStringAsync") }.exceptionOrNull()
    assertNotNull(exception)
    assertTrue(exception is CodedException)
    assertEquals(ERR_CLIPBOARD_UNAVAILABLE, (exception as CodedException).code)
  }

  private val clipboardManager: ClipboardManager
    get() = ApplicationProvider
      .getApplicationContext<Context>()
      .getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
}

@Implements(className = ShadowContextImpl.CLASS_NAME)
class ContextWithoutClipboardService : ShadowContextImpl() {
  @Implementation
  override fun getSystemService(name: String): Any? = when (name) {
    Context.CLIPBOARD_SERVICE -> null
    else -> super.getSystemService(name)
  }
}
