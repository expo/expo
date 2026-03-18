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
        type = input.mimeTypes.firstOrNull() ?: "*/*"
        if (input.mimeTypes.size > 1) {
          putExtra(Intent.EXTRA_MIME_TYPES, input.mimeTypes.toTypedArray())
        }
        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, input.multipleFiles)
      }
    } else {
      Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
    }.also { intent ->
      // intent.addCategory(Intent.CATEGORY_OPENABLE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        input.initialUri.let { intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, it) }
      }
    }

  override fun parseResult(input: FilePickerContractOptions, resultCode: Int, intent: Intent?): FilePickerContractResult {
    if (resultCode == Activity.RESULT_CANCELED || intent == null) {
      return FilePickerContractResult.Cancelled
    }

    val takeFlags = (intent.flags.and((Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)))
    if (intent.clipData == null) {
      val uri = intent.data?.also {
        contentResolver.takePersistableUriPermission(it, takeFlags)
      }
      val pickedPath = when (input.pickerType) {
        PickerType.DIRECTORY -> FileSystemDirectory(uri ?: Uri.EMPTY)
        PickerType.FILE -> FileSystemFile(uri ?: Uri.EMPTY)
      }
      return FilePickerContractResult.Success(listOf(pickedPath))
    }

    val pickedPaths = mutableListOf<FileSystemPath>()
    val count = intent.clipData!!.itemCount
    for (i in 0 until count) {
      intent.clipData!!.getItemAt(i).uri?.let {
        contentResolver.takePersistableUriPermission(it, takeFlags)
        pickedPaths.add(
          when (input.pickerType) {
            PickerType.FILE -> FileSystemFile(it)
            PickerType.DIRECTORY -> FileSystemDirectory(it)
          }
        )
      }
    }

    return FilePickerContractResult.Success(pickedPaths)
  }
}

internal data class FilePickerContractOptions(val initialUri: Uri?, val mimeTypes: List<String>, val multipleFiles: Boolean, val pickerType: PickerType = PickerType.FILE) : Serializable

internal enum class PickerType {
  FILE,
  DIRECTORY
}

internal sealed class FilePickerContractResult {
  class Success(val paths: List<FileSystemPath>) : FilePickerContractResult()
  object Cancelled : FilePickerContractResult()
}
