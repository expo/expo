package expo.modules.clipboard

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.test.core.app.ApplicationProvider
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.errorCodeOf
import expo.modules.test.core.legacy.ModuleMock
import expo.modules.test.core.legacy.ModuleMockHolder
import expo.modules.test.core.legacy.assertCodedException
import io.mockk.confirmVerified
import io.mockk.verify
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements
import org.robolectric.shadows.ShadowContextImpl

private interface ClipboardModuleTestInterface {
  @Throws(CodedException::class)
  fun getStringAsync(options: GetStringOptions = GetStringOptions()): String

  @Throws(CodedException::class)
  fun setStringAsync(content: String, options: SetStringOptions = SetStringOptions()): Boolean

  @Throws(CodedException::class)
  fun hasStringAsync(): Boolean
}

private inline fun withClipboardMock(
  block: ModuleMockHolder<ClipboardModuleTestInterface, ClipboardModule>.() -> Unit
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
  fun `getStringAsync should support HTML`() = withClipboardMock {
    clipboardManager.setPrimaryClip(
      ClipData.newHtmlText(null, "hello world", "<p>hello world</p>")
    )

    val plainResult = module.getStringAsync()
    val htmlResult = module.getStringAsync(
      GetStringOptions().apply {
        preferredFormat = StringFormat.HTML
      }
    )
    assertEquals("hello world", plainResult)
    assertEquals("<p>hello world</p>", htmlResult)
  }

  @Test
  fun `setStringAsync should support HTML`() = withClipboardMock {
    module.setStringAsync(
      "<p>hello</p>",
      SetStringOptions().apply {
        inputFormat = StringFormat.HTML
      }
    )

    assertTrue(
      clipboardManager.primaryClipDescription?.hasMimeType(ClipDescription.MIMETYPE_TEXT_HTML) == true
    )
    assertEquals("<p>hello</p>", clipboardManager.primaryClip!!.getItemAt(0).htmlText)
  }

  @Test
  fun `hasStringAsync should return correct values`() = withClipboardMock {
    // plain text
    clipboardManager.setPrimaryClip(ClipData.newPlainText(null, "hello world"))
    var result = module.hasStringAsync()
    assertTrue("hasStringAsync returns false for plain text (should be true)", result)

    // html
    clipboardManager.setPrimaryClip(
      ClipData.newHtmlText(null, "hello world", "<p>hello world</p>")
    )
    result = module.hasStringAsync()
    assertTrue("hasStringAsync returns false for plain text (should be true)", result)

    // non-text content type
    clipboardManager.setPrimaryClip(ClipData.newRawUri(null, Uri.EMPTY))
    result = module.hasStringAsync()
    assertFalse("hasStringAsync returns true for non-text (should be false)", result)

    // empty clipboard
    clipboardManager.clearPrimaryClip()
    result = module.hasStringAsync()
    assertFalse("hasStringAsync returns true for empty clipboard (should be false)", result)
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
          it.getStringArrayList("contentTypes")?.contains("plain-text") == true
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
    verify(inverse = true) { eventEmitter.emit(CLIPBOARD_CHANGED_EVENT_NAME, any()) }
    confirmVerified(eventEmitter)
  }

  @Test
  @Config(shadows = [ContextWithoutClipboardService::class])
  fun `should throw when ClipboardManager is unavailable`() = withClipboardMock {
    val exception = runCatching { module.hasStringAsync() }.exceptionOrNull()

    assertCodedException(exception) {
      assertEquals(errorCodeOf<ClipboardUnavailableException>(), it.code)
    }
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
