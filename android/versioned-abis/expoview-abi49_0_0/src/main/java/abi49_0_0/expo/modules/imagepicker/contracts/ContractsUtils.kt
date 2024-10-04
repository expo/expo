package abi49_0_0.expo.modules.imagepicker.contracts

import android.net.Uri
import abi49_0_0.expo.modules.imagepicker.MediaType

/**
 * Data required to be returned upon successful contract completion
 */
internal sealed class ImagePickerContractResult private constructor() {
  class Success(val data: List<Pair<MediaType, Uri>>) : ImagePickerContractResult()
  class Cancelled : ImagePickerContractResult()
  class Error : ImagePickerContractResult()
}
