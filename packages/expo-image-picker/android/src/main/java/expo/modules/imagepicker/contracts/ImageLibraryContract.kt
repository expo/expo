package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.imagepicker.MediaType

/**
 * An [androidx.activity.result.contract.ActivityResultContract] to prompt the user to pick single or multiple image(s) or/and video(s),
 * receiving a `content://` [Uri] for each piece of content.
 *
 * @see [androidx.activity.result.contract.ActivityResultContracts.GetContent]
 */
internal class ImageLibraryContract(
  private val singleMimeType: String,
) : ImagePickerContract() {
  override fun createIntent(context: Context, input: Any?) =
    Intent(Intent.ACTION_GET_CONTENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType(singleMimeType)

  override fun parseResult(resultCode: Int, intent: Intent?) =
    if (resultCode == Activity.RESULT_CANCELED) ImagePickerContractResult.Cancelled()
    else ImagePickerContractResult.Success(MediaType.IMAGE to intent!!.data!!) // TODO (@bbarthec): forced nonnull, but it have to be like this, to be refactor
  // TODO (@bbarthec): add support for videos
}
