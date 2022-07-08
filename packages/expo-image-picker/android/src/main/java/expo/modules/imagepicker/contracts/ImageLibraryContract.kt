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
 * @see [androidx.activity.result.contract.ActivityResultContracts.GetContent],
 * @see [androidx.activity.result.contract.ActivityResultContracts.GetMultipleContents]
 */
internal class ImageLibraryContract(
  private val appContextProvider: AppContextProvider,
) : AppContextActivityResultContract<ImageLibraryContractOptions, ImagePickerContractResult> {
  override fun createIntent(context: Context, input: ImageLibraryContractOptions) =
    Intent(Intent.ACTION_GET_CONTENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType(input.options.mediaTypes.toMimeType())
      .apply {
        if (input.options.allowsMultipleSelection) {
          this.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }
      }

  override fun parseResult(input: ImageLibraryContractOptions, resultCode: Int, intent: Intent?) =
    if (resultCode == Activity.RESULT_CANCELED) {
      ImagePickerContractResult.Cancelled()
    } else if (input.options.allowsMultipleSelection) {
      val uris = requireNotNull(intent).getClipDataUris()
      val contentResolver = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null. "}.contentResolver
      ImagePickerContractResult.Success(uris.map { uri -> uri.toMediaType(contentResolver) to uri })
    } else {
      val uri = requireNotNull(requireNotNull(intent).data)
      val contentResolver = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null. " }.contentResolver
      val type = uri.toMediaType(contentResolver)
      ImagePickerContractResult.Success(listOf(type to uri))
    }
}

/**
 * Copied from [androidx.activity.result.contract.ActivityResultContracts.GetMultipleContents.getClipDataUris]
 */
internal fun Intent.getClipDataUris(): List<Uri> {
  // Use a LinkedHashSet to maintain any ordering that may be present in the ClipData
  val resultSet = LinkedHashSet<Uri>()
  data?.let { data ->
    resultSet.add(data)
  }
  val clipData = clipData
  if (clipData == null && resultSet.isEmpty()) {
    return emptyList()
  } else if (clipData != null) {
    for (i in 0 until clipData.itemCount) {
      val uri = clipData.getItemAt(i).uri
      if (uri != null) {
        resultSet.add(uri)
      }
    }
  }
  return ArrayList(resultSet)
}

internal data class ImageLibraryContractOptions(
  val options: ImagePickerOptions
) : Serializable
