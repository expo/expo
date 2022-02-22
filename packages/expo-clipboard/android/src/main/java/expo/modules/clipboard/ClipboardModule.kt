package expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
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
const val clipboardDirectoryName = ".clipboard"
const val clipboardChangedEventName = "onClipboardChanged"

class ClipboardModule : Module() {
  override fun definition() = ModuleDefinition {
    name(moduleName)

    // region Strings
    function("getStringAsync") {
      clipboardManager.firstItem?.text ?: ""
    }

    function("setStringAsync") { content: String ->
      val clip = ClipData.newPlainText(null, content)
      clipboardManager.setPrimaryClip(clip)
      return@function true
    }
    // endregion

    function("hasStringAsync") {
      clipboardManager
        .primaryClipDescription
        ?.hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN)
        ?: false
    }

    // region Images
    function("getImageAsync") { options: GetImageOptions, promise: Promise ->
      val imageUri = clipboardManager
        .takeIf { clipboardHasItemWithType("image/*") }
        ?.firstItem
        ?.uri
        ?: return@function null

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
    events(clipboardChangedEventName)

    onCreate {
      clipboardEventEmitter = ClipboardEventEmitter()
      clipboardEventEmitter.attachListener()
    }

    onDestroy {
      clipboardEventEmitter.detachListener()
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The coroutine scope has no job in it")
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
    File(context.cacheDir, clipboardDirectoryName).also { it.mkdirs() }
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
            clipboardChangedEventName,
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
