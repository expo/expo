package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.imagepicker.ImagePickerOptions
import expo.modules.imagepicker.MediaTypes
import expo.modules.imagepicker.getAllDataUris
import expo.modules.imagepicker.toMediaType
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.exception.Exceptions
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
  private val appContextProvider: AppContextProvider
) : AppContextActivityResultContract<ImageLibraryContractOptions, ImagePickerContractResult> {
  private val contentResolver: ContentResolver
    get() = appContextProvider.appContext.reactContext?.contentResolver
      ?: throw Exceptions.ReactContextLost()

  override fun createIntent(context: Context, input: ImageLibraryContractOptions): Intent {
    val intent = Intent(Intent.ACTION_GET_CONTENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType("*/*")
      .putExtra(
        Intent.EXTRA_MIME_TYPES,
        when (input.options.mediaTypes) {
          MediaTypes.IMAGES -> arrayOf("image/*")
          MediaTypes.VIDEOS -> arrayOf("video/*")
          else -> arrayOf("image/*", "video/*")
        }
      )

    if (input.options.allowsMultipleSelection) {
      val selectionLimit = input.options.selectionLimit

      if (selectionLimit > 1) {
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
      }
    }

    return intent
  }

  override fun parseResult(input: ImageLibraryContractOptions, resultCode: Int, intent: Intent?) =
    if (resultCode == Activity.RESULT_CANCELED) {
      ImagePickerContractResult.Cancelled
    } else {
      intent?.takeIf { resultCode == Activity.RESULT_OK }?.getAllDataUris()?.let { uris ->
        if (input.options.allowsMultipleSelection) {
          ImagePickerContractResult.Success(
            uris.take(input.options.selectionLimit).map { uri ->
              uri.toMediaType(contentResolver) to uri
            }
          )
        } else {
          if (intent.data != null) {
            intent.data?.let { uri ->
              val type = uri.toMediaType(contentResolver)
              ImagePickerContractResult.Success(listOf(type to uri))
            }
          } else {
            uris.firstOrNull()?.let { uri ->
              val type = uri.toMediaType(contentResolver)
              ImagePickerContractResult.Success(listOf(type to uri))
            } ?: ImagePickerContractResult.Error
          }
        }
      } ?: ImagePickerContractResult.Error
    }
}

internal data class ImageLibraryContractOptions(
  val options: ImagePickerOptions
) : Serializable
