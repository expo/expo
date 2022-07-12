package expo.modules.imagepicker.contracts

import android.net.Uri
import androidx.activity.result.contract.ActivityResultContract
import expo.modules.imagepicker.MediaType

/**
 * Alias for [androidx.activity.result.contract.ActivityResultContract] with required generic types already specified
 */
internal typealias ImagePickerContract = ActivityResultContract<Any?, ImagePickerContractResult>

/**
 * Data required to be returned upon successful contract completion
 */
internal sealed class ImagePickerContractResult private constructor() {
  class Cancelled : ImagePickerContractResult()
  class Success(val data: List<Pair<MediaType, Uri>>) : ImagePickerContractResult()
}
