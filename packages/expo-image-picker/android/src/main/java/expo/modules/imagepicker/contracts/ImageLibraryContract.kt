package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.contract.ActivityResultContract
import expo.modules.imagepicker.toMediaType
import expo.modules.kotlin.providers.AppContextProvider

/**
 * An [androidx.activity.result.contract.ActivityResultContract] to prompt the user to pick single or multiple image(s) or/and video(s),
 * receiving a `content://` [Uri] for each piece of content.
 *
 * @see [androidx.activity.result.contract.ActivityResultContracts.GetContent]
 */
internal class ImageLibraryContract(
  private val appContextProvider: AppContextProvider,
) : ActivityResultContract<ImageLibraryContractOptions, ImagePickerContractResult>() {
  override fun createIntent(context: Context, input: ImageLibraryContractOptions) =
    Intent(Intent.ACTION_GET_CONTENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType(input.singleMimeType)

  override fun parseResult(resultCode: Int, intent: Intent?) =
    if (resultCode == Activity.RESULT_CANCELED) {
      ImagePickerContractResult.Cancelled()
    } else {
      val uri = requireNotNull(requireNotNull(intent).data)
      val contentResolver = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null. " }.contentResolver
      val type = uri.toMediaType(contentResolver)

      ImagePickerContractResult.Success(type to uri)
    }
}

internal data class ImageLibraryContractOptions(
  val singleMimeType: String,
)
