package expo.modules.imagepicker.crop

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.contract.ActivityResultContract
import expo.modules.imagepicker.MediaType


/**
 * An [ActivityResultContract] to prompt the user to pick single or multiple image(s) or/and video(s),
 * receiving a `content://` [Uri] for each piece of content.
 *
 * @see [ActivityResultContracts.GetContent] or [ActivityResultContracts.GetMultipleContents]
 */
internal class ImageLibraryContract(
  private val allowMultipleSelection: Boolean,
  private val singleMimeType: String,
  private val multipleMimeTypes: Array<String>?
): MediaPickerContract() {
  override fun createIntent(context: Context, input: Any?) =
    Intent(Intent.ACTION_GET_CONTENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType(singleMimeType)
      .apply {
        if (allowMultipleSelection) {
          putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
          putExtra(Intent.EXTRA_MIME_TYPES, multipleMimeTypes)
        }
      }

  override fun parseResult(resultCode: Int, intent: Intent?) = MediaPickerContractResult(
    cancelled = resultCode == Activity.RESULT_CANCELED,
    data = intent.takeIf { resultCode == Activity.RESULT_OK }?.getClipDataUris() ?: emptyList()
  )

  internal companion object {
    internal fun Intent.getClipDataUris(): List<Pair<MediaType, Uri>> {
      // Use a LinkedHashSet to maintain any ordering that may be
      // present in the ClipData
      val resultSet = LinkedHashSet<Pair<MediaType, Uri>>()
      data?.let { data ->
        resultSet.add(MediaType.IMAGE to data)
      }
      val clipData = clipData
      if (clipData == null && resultSet.isEmpty()) {
        return emptyList()
      } else if (clipData != null) {
        for (i in 0 until clipData.itemCount) {
          val uri = clipData.getItemAt(i).uri
          if (uri != null) {
            resultSet.add(MediaType.IMAGE to uri)
          }
        }
      }
      return ArrayList(resultSet)
    }
  }
}
