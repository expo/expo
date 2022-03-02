package expo.modules.clipboard

import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import androidx.test.core.app.ApplicationProvider
import expo.modules.kotlin.exception.CodedException
import expo.modules.test.core.ModuleMock
import expo.modules.test.core.ModuleMockHolder
import io.mockk.confirmVerified
import io.mockk.verify
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements
import org.robolectric.shadows.ShadowContextImpl

private val clipboardUnavailableErrorCode = ClipboardUnavailableException().code

private interface ClipboardModuleTestInterface {
  @Throws(CodedException::class)
  fun getStringAsync(): String

  @Throws(CodedException::class)
  fun setStringAsync(content: String): Boolean
}

private inline fun withClipboardMock(
  block: ModuleMockHolder<ClipboardModuleTestInterface>.() -> Unit
) = ModuleMock.createMock(ClipboardModuleTestInterface::class, ClipboardModule(), block = block)

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.P]) // API 28
class ClipboardModuleTest {

  @Test
  fun `should save to and read from clipboard`() = withClipboardMock {
    // write to clipboard
    val writeResult = module.setStringAsync("album dumbledore")

    // read from clipboard
    val readResult = module.getStringAsync()

    assertTrue(writeResult)
    assertEquals("album dumbledore", readResult)
  }

  @Test
  fun `should get empty string when clipboard is empty`() = withClipboardMock {
    // This requires API 28
    clipboardManager.clearPrimaryClip()

    val content = module.getStringAsync()

    assertTrue("Clipboard content should be empty", content.isEmpty())
  }

  @Test
  fun `should emit events when clipboard changes`() = withClipboardMock {
    // update clipboard content
    val result = module.setStringAsync("severus snape")

    // assert
    assertTrue(result)
    verify {
      eventEmitter.emit(
        CLIPBOARD_CHANGED_EVENT_NAME,
        match {
          it.getString("content") == "severus snape"
        }
      )
    }
    confirmVerified(eventEmitter)
  }

  @Test
  fun `shouldn't emit events when in background`() = withClipboardMock {
    // prepare
    controller.onActivityEntersBackground()

    // update clipboard content
    module.setStringAsync("ronald weasley")

    // assert that emit() was NOT called
    verify(inverse = true) { module.eventEmitter.emit(CLIPBOARD_CHANGED_EVENT_NAME, any()) }
    confirmVerified(eventEmitter)
  }

  @Test
  @Config(shadows = [ContextWithoutClipboardService::class])
  fun `should throw when ClipboardManager is unavailable`() = withClipboardMock {
    val exception = runCatching { module.getStringAsync() }.exceptionOrNull()
    assertNotNull(exception)
    assertTrue(exception is CodedException)
    assertEquals(clipboardUnavailableErrorCode, (exception as CodedException).code)
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
