package abi44_0_0.expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipboardManager

import abi44_0_0.expo.modules.core.ExportedModule
import abi44_0_0.expo.modules.core.ModuleRegistry
import abi44_0_0.expo.modules.core.Promise
import abi44_0_0.expo.modules.core.interfaces.ExpoMethod

class ClipboardModule(context: Context) : ExportedModule(context) {
  private val NAME = "ExpoClipboard"

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    ClipboardEventEmitter(context, moduleRegistry)
  }

  @ExpoMethod
  fun getStringAsync(promise: Promise) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = clipboard.primaryClip
    if (clip != null && clip.itemCount >= 1) {
      promise.resolve(clip.getItemAt(0).text)
    } else {
      promise.resolve("")
    }
  }

  @ExpoMethod
  fun setString(content: String, promise: Promise) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(null, content)
    clipboard.setPrimaryClip(clip)
    promise.resolve(null)
  }
}
