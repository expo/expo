package abi42_0_0.expo.modules.clipboard

import android.content.Context
import android.content.ClipData
import android.content.ClipboardManager

import abi42_0_0.org.unimodules.core.ExportedModule
import abi42_0_0.org.unimodules.core.ModuleRegistry
import abi42_0_0.org.unimodules.core.Promise
import abi42_0_0.org.unimodules.core.interfaces.ExpoMethod

class ClipboardModule(context: Context) : ExportedModule(context) {

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    ClipboardEventEmitter(context, moduleRegistry)
  }

  @ExpoMethod
  fun getStringAsync(promise: Promise) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = clipboard.getPrimaryClip()
    if (clip != null && clip.getItemCount() >= 1) {
        promise.resolve(clip.getItemAt(0).getText());
    } else {
        promise.resolve("");
    }
  }

  @ExpoMethod
  fun setString(content: String, promise: Promise) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(null, content)
    clipboard.setPrimaryClip(clip)
    promise.resolve(null);
  }

  companion object {
    private val NAME = "ExpoClipboard"
  }
}
