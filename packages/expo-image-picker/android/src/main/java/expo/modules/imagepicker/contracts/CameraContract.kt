package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import androidx.activity.result.contract.ActivityResultContract
import expo.modules.imagepicker.toMediaType
import expo.modules.kotlin.providers.AppContextProvider

/**
 * An [ActivityResultContract] to [take a picture][MediaStore.ACTION_IMAGE_CAPTURE] or [take a video][MediaStore.ACTION_VIDEO_CAPTURE]
 * saving it into the provided content-[Uri].
 *
 * @see [androidx.activity.result.contract.ActivityResultContracts.TakePicture] or [androidx.activity.result.contract.ActivityResultContracts.CaptureVideo]
 */
internal class CameraContract(
  private val appContextProvider: AppContextProvider,
) : ActivityResultContract<CameraContractOptions, ImagePickerContractResult>() {
  override fun createIntent(context: Context, input: CameraContractOptions): Intent =
    Intent(input.intentAction)
      .putExtra(MediaStore.EXTRA_OUTPUT, input.uri)
      .apply {
        if (input.intentAction == MediaStore.ACTION_VIDEO_CAPTURE) {
          putExtra(MediaStore.EXTRA_DURATION_LIMIT, input.videoMaxDuration)
        }
      }

  override fun parseResult(resultCode: Int, intent: Intent?): ImagePickerContractResult =
    if (resultCode == Activity.RESULT_CANCELED) {
      ImagePickerContractResult.Cancelled()
    } else {
      val contentResolver = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null. " }.contentResolver
      val uri = intent?.data ?: throw IllegalStateException("No data available in Intent")
      val type = uri.toMediaType(contentResolver)
      ImagePickerContractResult.Success(type to uri)
    }
}

data class CameraContractOptions(
  val uri: Uri,
  /**
   * Either [MediaStore.ACTION_IMAGE_CAPTURE] or [MediaStore.ACTION_VIDEO_CAPTURE]
   */
  val intentAction: String,
  val videoMaxDuration: Int,
)
