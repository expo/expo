// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Typeface
import android.net.Uri

import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.Promise

import expo.modules.interfaces.font.FontManagerInterface
import expo.modules.interfaces.constants.ConstantsInterface

import java.io.File
import java.lang.Exception

private const val ASSET_SCHEME = "asset://"
private const val EXPORTED_NAME = "ExpoFontLoader"

class FontLoaderModule(context: Context) : ExportedModule(context) {
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName(): String {
    return EXPORTED_NAME
  }

  @ExpoMethod
  fun loadAsync(fontFamilyName: String, localUri: String, promise: Promise) {
    try {
      // TODO: remove Expo references
      // https://github.com/expo/expo/pull/4652#discussion_r296630843
      val prefix = if (isScoped) {
        "ExpoFont-"
      } else {
        ""
      }

      // TODO(nikki): make sure path is in experience's scope
      val typeface: Typeface = if (localUri.startsWith(ASSET_SCHEME)) {
        Typeface.createFromAsset(
          context.assets, // Also remove the leading slash.
          localUri.substring(ASSET_SCHEME.length + 1)
        )
      } else {
        Typeface.createFromFile(File(Uri.parse(localUri).path))
      }

      val fontManager: FontManagerInterface? by moduleRegistry()
      if (fontManager == null) {
        promise.reject("E_NO_FONT_MANAGER", "There is no FontManager in module registry. Are you sure all the dependencies of expo-font are installed and linked?")
        return
      }

      fontManager!!.setTypeface(prefix + fontFamilyName, Typeface.NORMAL, typeface)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_UNEXPECTED", "Font.loadAsync unexpected exception: " + e.message, e)
    }
  }

  // If there's no constants module, or app ownership isn't "expo", we're not in Expo Client.
  private val isScoped: Boolean
    get() {
      val constantsModule: ConstantsInterface? by moduleRegistry()
      // If there's no constants module, or app ownership isn't "expo", we're not in Expo Client.
      return constantsModule != null && "expo" == constantsModule!!.appOwnership
    }
}
