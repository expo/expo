@file:OptIn(EitherType::class)

package expo.modules.imagemanipulator

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.util.Base64
import expo.modules.imagemanipulator.transformers.CropTransformer
import expo.modules.imagemanipulator.transformers.FlipTransformer
import expo.modules.imagemanipulator.transformers.ResizeTransformer
import expo.modules.imagemanipulator.transformers.RotateTransformer
import expo.modules.interfaces.imageloader.ImageLoaderInterface.ResultListener
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.EitherOfThree
import expo.modules.kotlin.types.toKClass
import kotlinx.coroutines.async
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class ImageManipulatorModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun createManipulatorContext(url: Uri): ImageManipulatorContext {
    val loader = suspend {
      val imageLoader = appContext.imageLoader
        ?: throw ImageLoaderNotFoundException()

      suspendCancellableCoroutine { continuation ->
        imageLoader.loadImageForManipulationFromURL(
          url.toString(),
          object : ResultListener {
            override fun onSuccess(bitmap: Bitmap) {
              continuation.resume(bitmap)
            }

            override fun onFailure(cause: Throwable?) {
              continuation.resumeWithException(ImageLoadingFailedException(url.toString(), cause.toCodedException()))
            }
          }
        )
      }
    }

    val task = ManipulatorTask(appContext.backgroundCoroutineScope, loader)
    return ImageManipulatorContext(runtimeContext, task)
  }

  private fun createManipulatorContext(bitmap: Bitmap): ImageManipulatorContext {
    val task = ManipulatorTask(appContext.backgroundCoroutineScope) { bitmap }
    return ImageManipulatorContext(runtimeContext, task)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoImageManipulator")

    Function("manipulate") { url: EitherOfThree<Uri, SharedRef<Bitmap>, SharedRef<Drawable>> ->
      return@Function if (url.`is`(Uri::class)) {
        createManipulatorContext(url.get(Uri::class))
      } else if (url.`is`(toKClass<SharedRef<Bitmap>>())) {
        val bitmap = url.get(toKClass<SharedRef<Bitmap>>()).ref
        createManipulatorContext(bitmap)
      } else {
        val drawable = url.get(toKClass<SharedRef<Drawable>>()).ref
        val bitmap = (drawable as? BitmapDrawable)?.bitmap
          ?: throw Exceptions.IllegalArgument("The drawable cannot be converted to a bitmap")
        createManipulatorContext(bitmap)
      }
    }

    Class<ImageManipulatorContext>("Context") {
      Constructor { url: Uri ->
        createManipulatorContext(url)
      }

      Function("resize") { context: ImageManipulatorContext, options: ResizeOptions ->
        context.addTransformer(ResizeTransformer(options))
      }

      Function("rotate") { context: ImageManipulatorContext, rotation: Float ->
        context.addTransformer(RotateTransformer(rotation))
      }

      Function("flip") { context: ImageManipulatorContext, flipType: FlipType ->
        context.addTransformer(FlipTransformer(flipType))
      }

      Function("crop") { context: ImageManipulatorContext, rect: CropRect ->
        context.addTransformer(CropTransformer(rect))
      }

      Function("reset") { context: ImageManipulatorContext ->
        context.reset()
      }

      AsyncFunction("renderAsync") Coroutine { context: ImageManipulatorContext ->
        val image = context.render()
        ImageRef(image, runtimeContext)
      }
    }

    Class<ImageRef>("Image") {
      Property("width") { image: ImageRef -> image.ref.width }
      Property("height") { image: ImageRef -> image.ref.height }

      AsyncFunction("saveAsync") Coroutine { image: ImageRef, options: ManipulateOptions? ->
        val options = options ?: ManipulateOptions()
        val path = FileUtils.generateRandomOutputPath(context, options.format)
        val compression = (options.compress * 100).toInt()
        val resultBitmap = image.ref

        var base64String: String? = null
        appContext.backgroundCoroutineScope.async {
          FileOutputStream(path).use { fileOut ->
            val compressFormat = options.format.compressFormat
            resultBitmap.compress(compressFormat, compression, fileOut)
            if (options.base64) {
              ByteArrayOutputStream().use { byteOut ->
                resultBitmap.compress(compressFormat, compression, byteOut)
                base64String = Base64.encodeToString(byteOut.toByteArray(), Base64.NO_WRAP)
              }
            }
          }
        }.await()

        mapOf(
          "uri" to Uri.fromFile(File(path)).toString(),
          "width" to resultBitmap.width,
          "height" to resultBitmap.height,
          "base64" to base64String
        )
      }
    }
  }
}
