package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia
import androidx.activity.result.contract.ActivityResultContracts.PickMultipleVisualMedia
import expo.modules.imagepicker.ImagePickerOptions
import expo.modules.imagepicker.MediaTypes
import expo.modules.imagepicker.UNLIMITED_SELECTION
import expo.modules.imagepicker.getAllDataUris
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
  private val contentResolver: ContentResolver
    get() = requireNotNull(appContextProvider.appContext.reactContext) {
      "React Application Context is null"
    }.contentResolver

  override fun createIntent(context: Context, input: ImageLibraryContractOptions): Intent {
    val request = PickVisualMediaRequest.Builder()
      .setMediaType(
        when (input.options.mediaTypes) {
          MediaTypes.VIDEOS -> {
            PickVisualMedia.VideoOnly
          }

          MediaTypes.IMAGES -> {
            PickVisualMedia.ImageOnly
          }

          else -> {
            PickVisualMedia.ImageAndVideo
          }
        }
      )
      .build()

    if (input.options.allowsMultipleSelection) {
      val selectionLimit = input.options.selectionLimit

      if (selectionLimit == 1) {
        // If multiple selection is allowed but the limit is 1, we should ignore
        // the multiple selection flag and just treat it as a single selection.
        return PickVisualMedia().createIntent(context, request)
      }

      if (selectionLimit > 1) {
        return PickMultipleVisualMedia(selectionLimit).createIntent(context, request)
      }

      // If the selection limit is 0, it is the same as unlimited selection.
      if (selectionLimit == UNLIMITED_SELECTION) {
        return PickMultipleVisualMedia().createIntent(context, request)
      }
    }

    return PickVisualMedia().createIntent(context, request)
  }

  override fun parseResult(input: ImageLibraryContractOptions, resultCode: Int, intent: Intent?) =
    if (resultCode == Activity.RESULT_CANCELED) {
      ImagePickerContractResult.Cancelled()
    } else {
      intent?.takeIf { resultCode == Activity.RESULT_OK }?.getAllDataUris()?.let { uris ->
        if (input.options.allowsMultipleSelection) {
          ImagePickerContractResult.Success(
            uris.map { uri ->
              uri.toMediaType(contentResolver) to uri
            }
          )
        } else {
          if (intent.data != null) {
            intent.data?.let {
              val type = it.toMediaType(contentResolver)
              ImagePickerContractResult.Success(listOf(type to it))
            }
          } else {
            uris.firstOrNull()?.let { uri ->
              val type = uri.toMediaType(contentResolver)
              ImagePickerContractResult.Success(listOf(type to uri))
            } ?: ImagePickerContractResult.Error()
          }
        }
      } ?: ImagePickerContractResult.Error()
    }
}

internal data class ImageLibraryContractOptions(
  val options: ImagePickerOptions
) : Serializable
