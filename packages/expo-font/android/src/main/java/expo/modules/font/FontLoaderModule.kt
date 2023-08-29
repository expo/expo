// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.graphics.Typeface
import android.net.Uri
import expo.modules.interfaces.font.FontManagerInterface
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

private const val ASSET_SCHEME = "asset://"

private class FontManagerInterfaceNotFoundException :
  CodedException("FontManagerInterface not found")

private class FileNotFoundException(uri: String) :
  CodedException("File '$uri' doesn't exist")

open class FontLoaderModule : Module() {
  @Suppress("MemberVisibilityCanBePrivate")
  open val prefix = ""

  override fun definition() = ModuleDefinition {
    Name("ExpoFontLoader")

    AsyncFunction("loadAsync") { fontFamilyName: String, localUri: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

      // TODO(nikki): make sure path is in experience's scope
      val typeface: Typeface = if (localUri.startsWith(ASSET_SCHEME)) {
        Typeface.createFromAsset(
          context.assets, // Also remove the leading slash.
          localUri.substring(ASSET_SCHEME.length + 1)
        )
      } else {
        val file = Uri.parse(localUri).path?.let { File(it) }
          ?: throw FileNotFoundException(localUri)

        Typeface.createFromFile(file)
      }

      val fontManager = appContext.legacyModule<FontManagerInterface>()
        ?: throw FontManagerInterfaceNotFoundException()

      fontManager.setTypeface(prefix + fontFamilyName, Typeface.NORMAL, typeface)
    }
  }
}
