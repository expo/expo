package expo.modules.imagepicker.contracts

import android.net.Uri
import expo.modules.imagepicker.MediaType

/**
 * Data required to be returned upon successful contract completion
 */
internal sealed class ImagePickerContractResult private constructor() {
  class Success(val data: List<Pair<MediaType, Uri>>) : ImagePickerContractResult()
  object Cancelled : ImagePickerContractResult()
  object Error : ImagePickerContractResult()
}
