package expo.modules.imagemanipulator

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.util.Base64
import expo.modules.imagemanipulator.arguments.Actions
import expo.modules.interfaces.imageloader.ImageLoaderInterface.ResultListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

private const val ERROR_TAG = "E_IMAGE_MANIPULATOR"

class ImageManipulatorModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoImageManipulator")

    AsyncFunction("manipulateAsync") { uri: String, actionsRaw: List<ManipulateAction>, saveOptions: SaveOptions, promise: Promise ->
      val actions = Actions.fromArgument(actionsRaw)
      appContext.imageLoader?.loadImageForManipulationFromURL(
        uri,
        object : ResultListener {
          override fun onSuccess(bitmap: Bitmap) {
            runActions(bitmap, actions, saveOptions, promise)
          }

          override fun onFailure(cause: Throwable?) {
            promise.reject(ImageDecodeException(uri, cause))
          }
        }
      )
    }
  }

  private fun runActions(bitmap: Bitmap, actions: Actions, saveOptions: SaveOptions, promise: Promise) {
    val resultBitmap = actions.actions.fold(bitmap) { acc, action -> action.run(acc) }
    val path = FileUtils.generateRandomOutputPath(context, saveOptions.compressFormat)
    val compression = (saveOptions.compress * 100).toInt()

    var base64String: String? = null

    FileOutputStream(path).use { fileOut ->
      resultBitmap.compress(saveOptions.compressFormat, compression, fileOut)
      if (saveOptions.base64) {
        ByteArrayOutputStream().use { byteOut ->
          resultBitmap.compress(saveOptions.compressFormat, compression, byteOut)
          base64String = Base64.encodeToString(byteOut.toByteArray(), Base64.NO_WRAP)
        }
      }
    }

    promise.resolve(
      ImageResult(
        uri = Uri.fromFile(File(path)).toString(),
        width = resultBitmap.width,
        height = resultBitmap.height,
        base64 = base64String
      )
    )
  }
}
