package expo.modules.imagepicker.crop

import android.net.Uri
import androidx.activity.result.contract.ActivityResultContract
import expo.modules.imagepicker.MediaType

internal data class MediaPickerContractResult(
  val cancelled: Boolean,
  val data: List<Pair<MediaType, Uri>>
)

internal typealias MediaPickerContract = ActivityResultContract<Any?, MediaPickerContractResult>
