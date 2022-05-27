package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import androidx.activity.result.contract.ActivityResultContract
import expo.modules.imagepicker.MediaType

/**
 * An [ActivityResultContract] to [take a picture][MediaStore.ACTION_IMAGE_CAPTURE] or [take a video][MediaStore.ACTION_VIDEO_CAPTURE]
 * saving it into the provided content-[Uri].
 *
 * @param intentAction expecting [MediaStore.ACTION_IMAGE_CAPTURE] or [MediaStore.ACTION_VIDEO_CAPTURE]
 * @see [androidx.activity.result.contract.ActivityResultContracts.TakePicture] or [androidx.activity.result.contract.ActivityResultContracts.CaptureVideo]
 */
internal class CameraContract(
  private val uri: Uri,
  private val intentAction: String,
) : ImagePickerContract() {
  override fun createIntent(context: Context, input: Any?) =
    Intent(intentAction)
      .putExtra(MediaStore.EXTRA_OUTPUT, uri)

  override fun parseResult(resultCode: Int, intent: Intent?) =
    if (resultCode == Activity.RESULT_CANCELED) ImagePickerContractResult.Cancelled()
    else ImagePickerContractResult.Success(MediaType.IMAGE to uri) // TODO (@bbarthec): add support for videos
}

