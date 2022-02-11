package expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipboardManager
import android.os.Bundle
import android.util.Log
import expo.modules.core.utilities.ifNull

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val moduleName = "ExpoClipboard"
private const val clipboardChangedEventName = "onClipboardChanged"
private val TAG = ClipboardModule::class.java.simpleName

class ClipboardModule : Module() {
  override fun definition() = ModuleDefinition {
    name(moduleName)

    function("getStringAsync") {
      val clip = clipboardManager?.primaryClip?.takeIf { it.itemCount >= 1 }
      val value = clip?.getItemAt(0)?.text ?: ""
      value
    }

    function("setString") { content: String ->
      val clip = ClipData.newPlainText(null, content)
      clipboardManager?.setPrimaryClip(clip)
    }

    events(clipboardChangedEventName)

    onCreate {
      clipboardEventEmitter = ClipboardEventEmitter()
    }

    onActivityEntersBackground {
      clipboardEventEmitter.pauseListening()
    }

    onActivityEntersForeground {
      clipboardEventEmitter.resumeListening()
    }
  }

  private val context
    get() = requireNotNull(appContext.reactContext)

  private val clipboardManager: ClipboardManager?
    get() = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager

  private lateinit var clipboardEventEmitter: ClipboardEventEmitter

  private inner class ClipboardEventEmitter {
    private var isListening = true

    init {
      val manager = clipboardManager
      manager?.addPrimaryClipChangedListener listener@{
        manager.primaryClip
          ?.takeIf { isListening && it.itemCount >= 1 }
          ?.let {
            this@ClipboardModule.sendEvent(
              clipboardChangedEventName,
              Bundle().apply {
                putString("content", it.getItemAt(0).text.toString())
              }
            )
          }
      }.ifNull {
        Log.e(TAG, "CLIPBOARD_SERVICE unavailable. Events won't be received")
      }
    }

    fun resumeListening() { isListening = true; }
    fun pauseListening() { isListening = false; }
  }
}
