package expo.modules.imagepicker.contracts

import android.net.Uri
import expo.modules.imagepicker.MediaType

typealias MediaList = List<Pair<MediaType?, Uri>>

/**
 * Data required to be returned upon successful contract completion
 */
internal sealed class ImagePickerContractResult {
  class Success(val data: MediaList) : ImagePickerContractResult()
  object Cancelled : ImagePickerContractResult()
  object Error : ImagePickerContractResult()
}
