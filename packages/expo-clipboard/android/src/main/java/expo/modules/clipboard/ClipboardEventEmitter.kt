package expo.modules.clipboard

import android.content.Context
import android.content.ClipboardManager
import android.os.Bundle
import android.util.Log

import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.core.interfaces.services.UIManager

class ClipboardEventEmitter(context: Context, moduleRegistry: ModuleRegistry) : LifecycleEventListener {
  private val onClipboardEventName = "onClipboardChanged"
  private var isListening = true
  private var eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)

  init {
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
    if (clipboard == null) {
      Log.e("Clipboard", "CLIPBOARD_SERVICE unavailable. Events wont be received")
    } else {
      clipboard.addPrimaryClipChangedListener {
        if (isListening) {
          val clip = clipboard.primaryClip
          if (clip != null && clip.itemCount >= 1) {
            eventEmitter.emit(
              onClipboardEventName,
              Bundle().apply {
                putString("content", clip.getItemAt(0).text.toString())
              }
            )
          }
        }
      }
    }
  }

  override fun onHostResume() {
    isListening = true
  }

  override fun onHostPause() {
    isListening = false
  }

  override fun onHostDestroy() = Unit
}
