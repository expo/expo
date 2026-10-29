package expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.os.Build
import android.os.PersistableBundle
import android.text.Html
import android.text.Html.FROM_HTML_MODE_LEGACY
import android.text.Spanned
import android.text.TextUtils
import android.util.Log
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

private val TAG = ClipboardModule::class.java.simpleName

// this must match the one from `res/xml/clipboard_provider_paths.xml`
const val CLIPBOARD_DIRECTORY_NAME = ".clipboard"
const val CLIPBOARD_CHANGED_EVENT_NAME = "onClipboardChanged"

internal enum class ContentType(val jsName: String) : Enumerable {
  PLAIN_TEXT("plain-text"),
  HTML("html"),
  IMAGE("image")
}

@Record
internal data class ClipboardChangedEvent(val contentTypes: List<ContentType>)

@ExpoModule("ExpoClipboard")
class ClipboardModule : Module() {
  // region Strings
  @JS
  suspend fun getStringAsync(options: GetStringOptions): String = withContext(Dispatchers.IO) {
    val item = clipboardManager.firstItem
    when (options.preferredFormat) {
      StringFormat.PLAIN -> item?.coerceToPlainText(androidContext)
      StringFormat.HTML -> item?.coerceToHtmlText(androidContext)
    } ?: ""
  }

  @JS
  suspend fun setStringAsync(content: String, options: SetStringOptions): Boolean = withContext(Dispatchers.IO) {
    val clip = when (options.inputFormat) {
      StringFormat.PLAIN -> ClipData.newPlainText(null, content)
      StringFormat.HTML -> {
        // HTML clip requires complementary plain text content
        val plainText = plainTextFromHtml(content)
        ClipData.newHtmlText(null, plainText, content)
      }
    }.applyIsSensitive(options.isSensitive)
    clipboardManager.setPrimaryClip(clip)
    true
  }

  @JS
  suspend fun hasStringAsync(): Boolean = withContext(Dispatchers.IO) {
    clipboardManager
      .primaryClipDescription
      ?.hasTextContent
      ?: false
  }
  // endregion

  // region Images
  @JS
  suspend fun getImageAsync(options: GetImageOptions): ClipboardImage? = withContext(Dispatchers.IO) {
    val imageUri = clipboardManager
      .takeIf { clipboardHasItemWithType("image/*") }
      ?.firstItem
      ?.uri
      .ifNull {
        return@withContext null
      }

    try {
      imageFromContentUri(androidContext, imageUri, options).toClipboardImage()
    } catch (err: Throwable) {
      err.printStackTrace()
      throw when (err) {
        is CodedException -> err
        is SecurityException -> NoPermissionException(err)
        else -> PasteFailureException(err, kind = "image")
      }
    }
  }

  @JS
  suspend fun setImageAsync(imageData: String, options: SetImageOptions): Unit = withContext(Dispatchers.IO) {
    try {
      val clip = clipDataFromBase64Image(androidContext, imageData, clipboardCacheDir)
        .applyIsSensitive(options.isSensitive)
      clipboardManager.setPrimaryClip(clip)
    } catch (err: Throwable) {
      err.printStackTrace()
      throw when (err) {
        is CodedException -> err
        else -> CopyFailureException(err, kind = "image")
      }
    }
  }

  @JS
  suspend fun hasImageAsync(): Boolean = withContext(Dispatchers.IO) {
    clipboardManager.primaryClipDescription?.hasMimeType("image/*") == true
  }
  //endregion

  // region Events
  @Event(name = CLIPBOARD_CHANGED_EVENT_NAME)
  private val onClipboardChanged = event<ClipboardChangedEvent>(
    onStartObserving = ::startListening,
    onStopObserving = ::stopListening
  )

  override fun onDestroy() {
    stopListening()
  }

  private fun startListening() {
    val emitter = clipboardEventEmitter
      ?: ClipboardEventEmitter(
        clipboardManager = runCatching { clipboardManager }.getOrNull(),
        reactContext = reactContextOrNull,
        onChange = { onClipboardChanged(it) }
      ).also { clipboardEventEmitter = it }
    emitter.attachListener()
  }

  private fun stopListening() {
    clipboardEventEmitter?.detachListener()
  }
  // endregion

  private val clipboardManager: ClipboardManager
    get() = androidContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
      ?: throw ClipboardUnavailableException()

  private val clipboardCacheDir: File by lazy {
    File(androidContext.cacheDir, CLIPBOARD_DIRECTORY_NAME).also { it.mkdirs() }
  }

  // Created when the first listener subscribes, because the module has no context before.
  private var clipboardEventEmitter: ClipboardEventEmitter? = null

  // region Utilities

  /**
   * Check whether the clipboard contains the given MIME type.
   *
   * Does NOT trigger the "Pasted from clipboard" toast on Android 12+
   *
   * @param mimeType The desired MIME type. May be a pattern, accepts wildcards.
   * @return Returns `true` if one of items in the clipboard
   * matches the desired MIME type, otherwise returns `false`.
   */
  private fun clipboardHasItemWithType(mimeType: String) =
    clipboardManager.primaryClipDescription?.hasMimeType(mimeType) ?: false

  /**
   * Gets first item from the clipboard or null if empty
   */
  private val ClipboardManager.firstItem: ClipData.Item?
    get() = primaryClip?.takeIf { it.itemCount > 0 }?.getItemAt(0)

  // endregion
}

// region Clipboard event emitter
internal class ClipboardEventEmitter(
  private val clipboardManager: ClipboardManager?,
  private val reactContext: ReactContext?,
  private val onChange: (ClipboardChangedEvent) -> Unit
) : LifecycleEventListener {
  private var isListening = true
  private var timestamp = -1L

  override fun onHostResume() {
    isListening = true
  }

  override fun onHostPause() {
    isListening = false
  }

  override fun onHostDestroy() = Unit

  fun attachListener() {
    reactContext?.addLifecycleEventListener(this)
    clipboardManager?.addPrimaryClipChangedListener(listener).ifNull {
      Log.e(TAG, "'CLIPBOARD_SERVICE' unavailable. Events won't be received")
    }
  }

  fun detachListener() {
    reactContext?.removeLifecycleEventListener(this)
    clipboardManager?.removePrimaryClipChangedListener(listener)
  }

  private val listener = ClipboardManager.OnPrimaryClipChangedListener {
    clipboardManager.takeIf { isListening }
      ?.primaryClipDescription
      ?.let { clip ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          if (timestamp == clip.timestamp) {
            return@OnPrimaryClipChangedListener
          }
          timestamp = clip.timestamp
        }

        onChange(
          ClipboardChangedEvent(
            contentTypes = listOfNotNull(
              ContentType.PLAIN_TEXT.takeIf { clip.hasTextContent },
              ContentType.HTML.takeIf { clip.hasMimeType(ClipDescription.MIMETYPE_TEXT_HTML) },
              ContentType.IMAGE.takeIf { clip.hasMimeType("image/*") }
            )
          )
        )
      }
  }
}
// endregion

internal fun ClipData.applyIsSensitive(isSensitive: Boolean): ClipData {
  if (!isSensitive) {
    return this
  }

  val extraKey = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    ClipDescription.EXTRA_IS_SENSITIVE
  } else {
    "android.content.extra.IS_SENSITIVE"
  }

  description.extras = PersistableBundle().apply {
    putBoolean(extraKey, true)
  }

  return this
}

private fun plainTextFromHtml(htmlContent: String): String {
  val styledText: Spanned =
    Html.fromHtml(htmlContent, FROM_HTML_MODE_LEGACY)
  val chars = CharArray(styledText.length)
  TextUtils.getChars(styledText, 0, styledText.length, chars, 0)
  return String(chars)
}

/**
 * Turn this item into text, regardless of the type of data it
 * actually contains. It is the same as [ClipData.Item.coerceToText]
 * but this also supports HTML.
 *
 * The algorithm for deciding what text to return is:
 * - If [ClipData.Item.getHtmlText]  is non-null, strip HTML tags and return that.
 * See [plainTextFromHtml] for implementation details
 * - Otherwise, return the result of [ClipData.Item.coerceToText]
 *
 * @param context The caller's Context, from which its ContentResolver
 * and other things can be retrieved.
 * @return Returns the item's textual representation.
 */
private fun ClipData.Item.coerceToPlainText(context: Context): String =
  if (text == null && htmlText != null) {
    plainTextFromHtml(htmlText)
  } else {
    coerceToText(context).toString()
  }

/**
 * True if clipboard contains plain text or HTML content
 */
private val ClipDescription.hasTextContent: Boolean
  get() = hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN) ||
    hasMimeType(ClipDescription.MIMETYPE_TEXT_HTML)
