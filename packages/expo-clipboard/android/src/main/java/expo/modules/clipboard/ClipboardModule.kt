package expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipboardManager
import android.util.Log
import androidx.core.os.bundleOf
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.exception.CodedException

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val moduleName = "ExpoClipboard"
const val clipboardChangedEventName = "onClipboardChanged"
private val TAG = ClipboardModule::class.java.simpleName

const val ERR_CLIPBOARD_UNAVAILABLE = "ERR_CLIPBOARD_UNAVAILABLE"

class ClipboardUnavailableException :
  CodedException(ERR_CLIPBOARD_UNAVAILABLE, "'CLIPBOARD_SERVICE' is unavailable on this device", null)

class ClipboardModule : Module() {
  override fun definition() = ModuleDefinition {
    name(moduleName)

    function("getStringAsync") {
      val clip = clipboardManager.primaryClip?.takeIf { it.itemCount >= 1 }
      clip?.getItemAt(0)?.text ?: ""
    }

    function("setStringAsync") { content: String ->
      val clip = ClipData.newPlainText(null, content)
      clipboardManager.setPrimaryClip(clip)
      return@function true
    }

    events(clipboardChangedEventName)

    onCreate {
      clipboardEventEmitter = ClipboardEventEmitter()
      clipboardEventEmitter.attachListener()
    }

    onDestroy {
      clipboardEventEmitter.detachListener()
    }

    onActivityEntersBackground {
      clipboardEventEmitter.pauseListening()
    }

    onActivityEntersForeground {
      clipboardEventEmitter.resumeListening()
    }
  }

  private val context
    get() = requireNotNull(appContext.reactContext) {
      "React Application Context is null"
    }

  private val clipboardManager: ClipboardManager
    get() = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
      ?: throw ClipboardUnavailableException()

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
              "content" to clip.getItemAt(0).text.toString()
            )
          )
        }
    }

    private val maybeClipboardManager = runCatching { clipboardManager }.getOrNull()
  }
}
