package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.imagepicker.ImagePickerOptions
import expo.modules.imagepicker.toMediaType
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.providers.AppContextProvider
import java.io.Serializable

/**
 * An [androidx.activity.result.contract.ActivityResultContract] to prompt the user to pick single or multiple image(s) or/and video(s),
 * receiving a `content://` [Uri] for each piece of content.
 *
 * @see [androidx.activity.result.contract.ActivityResultContracts.GetContent]
 */
internal class ImageLibraryContract(
  private val appContextProvider: AppContextProvider,
) : AppContextActivityResultContract<ImageLibraryContractOptions, ImagePickerContractResult> {
  override fun createIntent(context: Context, input: ImageLibraryContractOptions) =
    Intent(Intent.ACTION_GET_CONTENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType(input.options.mediaTypes.toMimeType())

  override fun parseResult(input: ImageLibraryContractOptions, resultCode: Int, intent: Intent?) =
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
  val options: ImagePickerOptions
) : Serializable
