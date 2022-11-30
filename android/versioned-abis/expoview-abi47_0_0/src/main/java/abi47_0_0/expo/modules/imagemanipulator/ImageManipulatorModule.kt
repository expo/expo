package abi47_0_0.expo.modules.imagemanipulator

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import abi47_0_0.expo.modules.imagemanipulator.arguments.Actions
import abi47_0_0.expo.modules.imagemanipulator.arguments.SaveOptions
import abi47_0_0.expo.modules.interfaces.imageloader.ImageLoaderInterface
import abi47_0_0.expo.modules.interfaces.imageloader.ImageLoaderInterface.ResultListener
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.ModuleRegistryDelegate
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.arguments.ReadableArguments
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.*

private const val TAG = "ExpoImageManipulator"
private const val ERROR_TAG = "E_IMAGE_MANIPULATOR"

class ImageManipulatorModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {
  private val mImageLoader: ImageLoaderInterface by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()
  override fun getName() = TAG

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun manipulateAsync(uri: String, actionsRaw: ArrayList<Any?>, saveOptionsRaw: ReadableArguments, promise: Promise) {
    val saveOptions = SaveOptions.fromArguments(saveOptionsRaw)
    val actions = Actions.fromArgument(actionsRaw)
    mImageLoader.loadImageForManipulationFromURL(
      uri,
      object : ResultListener {
        override fun onSuccess(bitmap: Bitmap) {
          runActions(bitmap, actions, saveOptions, promise)
        }

        override fun onFailure(cause: Throwable?) {
          // No cleanup required here.
          val basicMessage = "Could not get decoded bitmap of $uri"
          if (cause != null) {
            promise.reject("${ERROR_TAG}_DECODE", "$basicMessage: $cause", cause)
          } else {
            promise.reject("${ERROR_TAG}_DECODE", "$basicMessage.")
          }
        }
      }
    )
  }

  private fun runActions(bitmap: Bitmap, actions: Actions, saveOptions: SaveOptions, promise: Promise) {
    val resultBitmap = actions.actions.fold(bitmap, { acc, action -> action.run(acc) })
    val path = FileUtils.generateRandomOutputPath(context, saveOptions.format)
    val compression = (saveOptions.compress * 100).toInt()

    var base64String: String? = null

    FileOutputStream(path).use { fileOut ->
      resultBitmap.compress(saveOptions.format, compression, fileOut)
      if (saveOptions.base64) {
        ByteArrayOutputStream().use { byteOut ->
          resultBitmap.compress(saveOptions.format, compression, byteOut)
          base64String = Base64.encodeToString(byteOut.toByteArray(), Base64.NO_WRAP)
        }
      }
    }

    val result = Bundle().apply {
      putString("uri", Uri.fromFile(File(path)).toString())
      putInt("width", resultBitmap.width)
      putInt("height", resultBitmap.height)
      if (base64String != null) {
        putString("base64", base64String)
      }
    }
    promise.resolve(result)
  }
}
