package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import androidx.activity.result.contract.ActivityResultContract
import androidx.core.net.toUri
import expo.modules.imagepicker.ImagePickerOptions
import expo.modules.imagepicker.CameraType
import expo.modules.imagepicker.toMediaType
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.providers.AppContextProvider
import java.io.Serializable

/**
 * An [ActivityResultContract] to [take a picture][MediaStore.ACTION_IMAGE_CAPTURE] or [take a video][MediaStore.ACTION_VIDEO_CAPTURE]
 * saving it into the provided content-[Uri].
 *
 * @see [androidx.activity.result.contract.ActivityResultContracts.TakePicture] or [androidx.activity.result.contract.ActivityResultContracts.CaptureVideo]
 */
internal class CameraContract(
  private val appContextProvider: AppContextProvider
) : AppContextActivityResultContract<CameraContractOptions, ImagePickerContractResult> {
  private val contentResolver: ContentResolver
    get() = requireNotNull(appContextProvider.appContext.reactContext) {
      "React Application Context is null"
    }.contentResolver

  override fun createIntent(context: Context, input: CameraContractOptions): Intent =
    Intent(input.options.nativeMediaTypes.toCameraIntentAction())
      .putExtra(MediaStore.EXTRA_OUTPUT, input.uri.toUri())
      .apply {
        if (input.options.nativeMediaTypes.toCameraIntentAction() == MediaStore.ACTION_VIDEO_CAPTURE) {
          putExtra(MediaStore.EXTRA_DURATION_LIMIT, input.options.videoMaxDuration)
        }
        if (input.options.cameraType == CameraType.FRONT) {
          putExtra("android.intent.extras.LENS_FACING_FRONT", 1)
          putExtra("android.intent.extras.CAMERA_FACING", 1)
          putExtra("android.intent.extra.USE_FRONT_CAMERA", true)
        } else {
          putExtra("android.intent.extras.LENS_FACING_BACK", 1)
          putExtra("android.intent.extras.CAMERA_FACING", 0)
          putExtra("android.intent.extra.USE_FRONT_CAMERA", false)
        }
      }

  override fun parseResult(input: CameraContractOptions, resultCode: Int, intent: Intent?): ImagePickerContractResult =
    if (resultCode == Activity.RESULT_CANCELED) {
      ImagePickerContractResult.Cancelled
    } else {
      val uri = Uri.parse(input.uri)
      val type = uri.toMediaType(contentResolver)
      ImagePickerContractResult.Success(listOf(type to uri))
    }
}

internal data class CameraContractOptions(
  /**
   * Destination file in a form of content-[Uri] to save results coming from camera to.
   */
  val uri: String,
  val options: ImagePickerOptions
) : Serializable
