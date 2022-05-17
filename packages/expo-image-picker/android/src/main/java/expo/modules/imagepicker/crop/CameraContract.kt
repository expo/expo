package expo.modules.imagepicker.crop

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
 * @see [ActivityResultContracts.TakePicture] or [ActivityResultContracts.CaptureVideo]
 */
internal class CameraContract(
  private val uri: Uri,
  private val intentAction: String,
): MediaPickerContract() {
  override fun createIntent(context: Context, input: Any?) =
    Intent(intentAction)
      .putExtra(MediaStore.EXTRA_OUTPUT, uri)

  override fun parseResult(resultCode: Int, intent: Intent?) = MediaPickerContractResult(
    cancelled = resultCode == Activity.RESULT_CANCELED,
    data = if (resultCode == Activity.RESULT_OK) listOf(MediaType.IMAGE to uri) else emptyList()
  )
}

