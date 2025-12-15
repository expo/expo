package expo.modules.filesystem

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.providers.AppContextProvider
import java.io.Serializable

@SuppressLint("WrongConstant")
internal class FilePickerContract(private val appContextProvider: AppContextProvider) : AppContextActivityResultContract<FilePickerContractOptions, FilePickerContractResult> {
  private val contentResolver: ContentResolver
    get() = requireNotNull(appContextProvider.appContext.reactContext) {
      "React Application Context is null"
    }.contentResolver

  override fun createIntent(context: Context, input: FilePickerContractOptions): Intent =
    if (input.pickerType == PickerType.FILE) {
      Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        // if no type is set no intent handler is found – just android things
        type = input.mimeType ?: "*/*"
      }
    } else {
      Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
    }.also { intent ->
      // intent.addCategory(Intent.CATEGORY_OPENABLE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        input.initialUri.let { intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, it) }
      }
    }

  override fun parseResult(input: FilePickerContractOptions, resultCode: Int, intent: Intent?): FilePickerContractResult =
    if (resultCode == Activity.RESULT_CANCELED || intent == null) {
      FilePickerContractResult.Cancelled
    } else {
      val uri = intent.data
      val takeFlags = (intent.flags.and((Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)))
      uri?.let {
        contentResolver.takePersistableUriPermission(it, takeFlags)
      }
      when (input.pickerType) {
        PickerType.DIRECTORY -> FilePickerContractResult.Success(
          FileSystemDirectory(
            uri
              ?: Uri.EMPTY
          )
        )

        PickerType.FILE -> {
          FilePickerContractResult.Success(FileSystemFile(uri ?: Uri.EMPTY))
        }
      }
    }
}

internal data class FilePickerContractOptions(val initialUri: Uri?, val mimeType: String? = null, val pickerType: PickerType = PickerType.FILE) : Serializable

internal enum class PickerType {
  FILE,
  DIRECTORY
}

internal sealed class FilePickerContractResult {
  class Success(val path: FileSystemPath) : FilePickerContractResult()
  object Cancelled : FilePickerContractResult()
}
