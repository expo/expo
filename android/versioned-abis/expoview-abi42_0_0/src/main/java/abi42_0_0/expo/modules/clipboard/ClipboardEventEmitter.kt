package abi42_0_0.expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipboardManager
import android.os.Bundle

import abi42_0_0.org.unimodules.core.ModuleRegistry
import abi42_0_0.org.unimodules.core.interfaces.LifecycleEventListener
import abi42_0_0.org.unimodules.core.interfaces.services.EventEmitter
import abi42_0_0.org.unimodules.core.interfaces.services.UIManager

import java.lang.Exception

class ClipboardEventEmitter(context: Context, moduleRegistry: ModuleRegistry) : LifecycleEventListener {
  private val onClipboardEventName: String = "onClipboardChanged"
  private var isListening: Boolean = true
  private var eventEmitter: EventEmitter

  init {
    moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)

    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.addPrimaryClipChangedListener {
      if (isListening) {
        val clip = clipboard.getPrimaryClip()
        if (clip != null && clip.getItemCount() >= 1) {
          val result = Bundle()
          result.putString("content", clip.getItemAt(0).getText().toString())
          eventEmitter.emit(onClipboardEventName, result)
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

  override fun onHostDestroy() {
    // Do nothing
  }
}
