package expo.modules.clipboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
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

internal val TAG = ClipboardModule::class.java.simpleName

// this must match the one from `res/xml/clipboard_provider_paths.xml`
const val CLIPBOARD_DIRECTORY_NAME = ".clipboard"

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
  suspend fun setStringAsync(content: String, options: SetStringOptions): Boolean =
    withContext(Dispatchers.IO) {
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
  suspend fun getImageAsync(options: GetImageOptions): ClipboardImage? =
    withContext(Dispatchers.IO) {
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
  suspend fun setImageAsync(imageData: String, options: SetImageOptions): Unit =
    withContext(Dispatchers.IO) {
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
  @Event(name = "onClipboardChanged")
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
