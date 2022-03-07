package expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.os.Build
import android.text.Html
import android.text.Html.FROM_HTML_MODE_LEGACY
import android.text.Spanned
import android.text.TextUtils
import android.util.Log
import androidx.core.os.bundleOf
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.File

private const val moduleName = "ExpoClipboard"
private val TAG = ClipboardModule::class.java.simpleName

// this must match the one from `res/xml/clipboard_provider_paths.xml`
const val CLIPBOARD_DIRECTORY_NAME = ".clipboard"
const val CLIPBOARD_CHANGED_EVENT_NAME = "onClipboardChanged"

class ClipboardModule : Module() {
  override fun definition() = ModuleDefinition {
    name(moduleName)

    // region Strings
    function("getStringAsync") { options: GetStringOptions ->
      val clip = clipboardManager.primaryClip?.takeIf { it.itemCount >= 1 }
      val firstItem = clip?.getItemAt(0)
      when (options.preferredType) {
        StringContentType.PLAIN -> firstItem?.coerceToPlainText(context)
        StringContentType.HTML -> firstItem?.coerceToHtmlText(context)
      } ?: ""
    }

    function("setStringAsync") { content: String, options: SetStringOptions ->
      val clip = when (options.inputType) {
        StringContentType.PLAIN -> ClipData.newPlainText(null, content)
        StringContentType.HTML -> {
          // HTML clip requires complementary plain text content
          val plainText = plainTextFromHtml(content)
          ClipData.newHtmlText(null, plainText, content)
        }
      }
      clipboardManager.setPrimaryClip(clip)
      return@function true
    }

    function("hasStringAsync") {
      clipboardManager
        .primaryClipDescription
        ?.let {
          it.hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN) ||
            it.hasMimeType(ClipDescription.MIMETYPE_TEXT_HTML)
        }
        ?: false
    }
    // endregion

    // region Images
    function("getImageAsync") { options: GetImageOptions, promise: Promise ->
      val imageUri = clipboardManager
        .takeIf { clipboardHasItemWithType("image/*") }
        ?.firstItem
        ?.uri
        .ifNull {
          promise.resolve(null)
          return@function
        }

      val exceptionHandler = CoroutineExceptionHandler { _, err ->
        err.printStackTrace()
        val rejectionCause = when (err) {
          is CodedException -> err
          is SecurityException -> NoPermissionException(err)
          else -> PasteFailureException(err, kind = "image")
        }
        promise.reject(rejectionCause)
      }

      moduleCoroutineScope.launch(exceptionHandler) {
        val imageResult = imageFromContentUri(context, imageUri, options)
        promise.resolve(imageResult.toBundle())
      }
    }

    function("setImageAsync") { imageData: String, promise: Promise ->
      val exceptionHandler = CoroutineExceptionHandler { _, err ->
        err.printStackTrace()
        val rejectionCause = when (err) {
          is CodedException -> err
          else -> CopyFailureException(err, kind = "image")
        }
        promise.reject(rejectionCause)
      }

      moduleCoroutineScope.launch(exceptionHandler) {
        val clip = clipDataFromBase64Image(context, imageData, clipboardCacheDir)
        clipboardManager.setPrimaryClip(clip)
        promise.resolve(null)
      }
    }

    function("hasImageAsync") {
      clipboardManager.primaryClipDescription?.hasMimeType("image/*") == true
    }
    //endregion

    // region Events
    events(CLIPBOARD_CHANGED_EVENT_NAME)

    onCreate {
      clipboardEventEmitter = ClipboardEventEmitter()
      clipboardEventEmitter.attachListener()
    }

    onDestroy {
      clipboardEventEmitter.detachListener()
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        // Ignore: The coroutine scope has no job in it
      }
    }

    onActivityEntersBackground {
      clipboardEventEmitter.pauseListening()
    }

    onActivityEntersForeground {
      clipboardEventEmitter.resumeListening()
    }
    // endregion
  }

  private val context
    get() = requireNotNull(appContext.reactContext) {
      "React Application Context is null"
    }

  private val clipboardManager: ClipboardManager
    get() = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
      ?: throw ClipboardUnavailableException()

  private val moduleCoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  private val clipboardCacheDir: File by lazy {
    File(context.cacheDir, CLIPBOARD_DIRECTORY_NAME).also { it.mkdirs() }
  }

  // region Clipboard event emitter
  private lateinit var clipboardEventEmitter: ClipboardEventEmitter

  private inner class ClipboardEventEmitter {
    private var isListening = true

    fun resumeListening() { isListening = true }
    fun pauseListening() { isListening = false }

    fun attachListener() = maybeClipboardManager?.addPrimaryClipChangedListener(listener).ifNull {
      Log.e(TAG, "'CLIPBOARD_SERVICE' unavailable. Events won't be received")
    }
    fun detachListener() = maybeClipboardManager?.removePrimaryClipChangedListener(listener)

    private val listener = ClipboardManager.OnPrimaryClipChangedListener {
      maybeClipboardManager.takeIf { isListening }
        ?.primaryClip
        ?.takeIf { it.itemCount >= 1 }
        ?.let { clip ->
          this@ClipboardModule.sendEvent(
            CLIPBOARD_CHANGED_EVENT_NAME,
            bundleOf(
              "content" to (clip.getItemAt(0).text?.toString() ?: "")
            )
          )
        }
    }

    private val maybeClipboardManager = runCatching { clipboardManager }.getOrNull()
  }
  // endregion

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

private fun plainTextFromHtml(htmlContent: String): String {
  val styledText: Spanned = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
    Html.fromHtml(htmlContent, FROM_HTML_MODE_LEGACY)
  } else {
    @Suppress("DEPRECATION")
    Html.fromHtml(htmlContent)
  }
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
  if (this.text == null && this.htmlText != null) {
    plainTextFromHtml(this.htmlText)
  } else {
    this.coerceToText(context).toString()
  }
