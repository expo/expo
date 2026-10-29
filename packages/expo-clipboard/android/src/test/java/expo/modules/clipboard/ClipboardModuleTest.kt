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
import expo.modules.test.core.legacy.assertCodedException
import io.github.expo.modules.v2.react.androidContext
import io.mockk.every
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import kotlinx.coroutines.runBlocking
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

/** Calls the module's suspend exports the way JavaScript would, with the default options. */
private class ClipboardModuleTestWrapper(private val module: ClipboardModule) {
  @Throws(CodedException::class)
  fun getStringAsync(options: GetStringOptions = GetStringOptions()): String =
    runBlocking { module.getStringAsync(options) }

  @Throws(CodedException::class)
  fun setStringAsync(content: String, options: SetStringOptions = SetStringOptions()): Boolean =
    runBlocking { module.setStringAsync(content, options) }

  @Throws(CodedException::class)
  fun hasStringAsync(): Boolean = runBlocking { module.hasStringAsync() }
}

private class ClipboardModuleMock(clipboardModule: ClipboardModule) {
  val module = ClipboardModuleTestWrapper(clipboardModule)
  val emittedEvents = mutableListOf<ClipboardChangedEvent>()
  lateinit var eventEmitter: ClipboardEventEmitter
}

// A JVM test has no Expo Modules v2 native library, so the module reads the application through
// a mocked `androidContext`, and the test listens to the clipboard the way the module does when
// JavaScript adds a listener.
private inline fun withClipboardMock(block: ClipboardModuleMock.() -> Unit) {
  val clipboardModule = ClipboardModule()
  val mock = ClipboardModuleMock(clipboardModule)
  val context = ApplicationProvider.getApplicationContext<Context>()

  mockkStatic(REACT_CONTEXT_EXTENSIONS)
  every { clipboardModule.androidContext } returns context
  mock.eventEmitter = ClipboardEventEmitter(
    clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager,
    reactContext = null,
    onChange = { mock.emittedEvents.add(it) }
  )
  mock.eventEmitter.attachListener()
  try {
    mock.block()
  } finally {
    mock.eventEmitter.detachListener()
    unmockkStatic(REACT_CONTEXT_EXTENSIONS)
  }
}

/** The file class that holds `androidContext`, which mockk mocks as a static. */
private const val REACT_CONTEXT_EXTENSIONS = "io.github.expo.modules.v2.react.ReactContextExtensionsKt"

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
      GetStringOptions(preferredFormat = StringFormat.HTML)
    )
    assertEquals("hello world", plainResult)
    assertEquals("<p>hello world</p>", htmlResult)
  }

  @Test
  fun `setStringAsync should support HTML`() = withClipboardMock {
    module.setStringAsync(
      "<p>hello</p>",
      SetStringOptions(inputFormat = StringFormat.HTML)
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
    assertTrue(emittedEvents.single().contentTypes.contains(ContentType.PLAIN_TEXT))
  }

  @Test
  fun `shouldn't emit events when in background`() = withClipboardMock {
    // prepare
    eventEmitter.onHostPause()

    // update clipboard content
    module.setStringAsync("ronald weasley")

    // assert that no event was emitted
    assertTrue(emittedEvents.isEmpty())
  }

  @Test
  @Config(shadows = [ContextWithoutClipboardService::class])
  fun `should throw when ClipboardManager is unavailable`() = withClipboardMock {
    val exception = runCatching { module.hasStringAsync() }.exceptionOrNull()

    assertCodedException(exception) {
      assertEquals(errorCodeOf<ClipboardUnavailableException>(), it.code)
    }
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.TIRAMISU]) // API 33
  fun `setStringAsync should set isSensitive flag on Android 13+`() = withClipboardMock {
    module.setStringAsync(
      "sensitive password",
      SetStringOptions(isSensitive = true)
    )

    val clipDescription = clipboardManager.primaryClipDescription
    val extras = clipDescription?.extras

    assertTrue("isSensitive flag should be set", extras?.getBoolean(ClipDescription.EXTRA_IS_SENSITIVE) == true)
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.S]) // API 31
  fun `setStringAsync should set isSensitive flag on Android 12L and below`() = withClipboardMock {
    module.setStringAsync(
      "sensitive password",
      SetStringOptions(isSensitive = true)
    )

    val clipDescription = clipboardManager.primaryClipDescription
    val extras = clipDescription?.extras

    assertTrue("isSensitive flag should be set with legacy key", extras?.getBoolean("android.content.extra.IS_SENSITIVE") == true)
  }

  @Test
  fun `setStringAsync should not set isSensitive flag when false`() = withClipboardMock {
    module.setStringAsync(
      "normal text",
      SetStringOptions(isSensitive = false)
    )

    val clipDescription = clipboardManager.primaryClipDescription
    val extras = clipDescription?.extras

    assertTrue("extras should be null when isSensitive is false", extras == null)
  }

  @Test
  fun `setStringAsync should not set isSensitive flag by default`() = withClipboardMock {
    module.setStringAsync("normal text")

    val clipDescription = clipboardManager.primaryClipDescription
    val extras = clipDescription?.extras

    assertTrue("extras should be null by default", extras == null)
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.TIRAMISU]) // API 33
  fun `setStringAsync with HTML should set isSensitive flag`() = withClipboardMock {
    module.setStringAsync(
      "<p>sensitive content</p>",
      SetStringOptions(inputFormat = StringFormat.HTML, isSensitive = true)
    )

    val clipDescription = clipboardManager.primaryClipDescription
    val extras = clipDescription?.extras

    assertTrue("HTML content should have isSensitive flag", extras?.getBoolean(ClipDescription.EXTRA_IS_SENSITIVE) == true)
    assertTrue("Should be HTML content", clipDescription?.hasMimeType(ClipDescription.MIMETYPE_TEXT_HTML) == true)
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
