package expo.modules.clipboard

import android.content.ClipDescription
import android.content.ClipboardManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import expo.modules.core.utilities.ifNull

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
