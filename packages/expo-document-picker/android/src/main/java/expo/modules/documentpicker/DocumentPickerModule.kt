package expo.modules.documentpicker

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import expo.modules.core.utilities.FileUtilities
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.apache.commons.io.FilenameUtils
import org.apache.commons.io.IOUtils
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

private const val OPEN_DOCUMENT_CODE = 4137

class DocumentPickerModule : Module() {
  private var pendingPromise: Promise? = null
  private var copyToCacheDirectory = true

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  override fun definition() = ModuleDefinition {
    Name("ExpoDocumentPicker")

    AsyncFunction("getDocumentAsync") { options: DocumentPickerOptions, promise: Promise ->
      if (pendingPromise != null) {
        throw PickingInProgressException()
      }
      pendingPromise = promise
      copyToCacheDirectory = options.copyToCacheDirectory
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = if (options.types != null && options.types.size > 1) {
          putExtra(Intent.EXTRA_MIME_TYPES, options.types)
          "*/*"
        } else {
          options.types?.get(0)
        }
      }
      currentActivity.startActivityForResult(intent, OPEN_DOCUMENT_CODE)
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != OPEN_DOCUMENT_CODE) {
        return@OnActivityResult
      }
      if (pendingPromise == null) {
        return@OnActivityResult
      }

      val promise = pendingPromise!!
      if (payload.resultCode == Activity.RESULT_OK) {
        payload.data?.data?.let { uri ->
          val originalDocumentDetails = DocumentDetailsReader(context).read(uri)
          if (!copyToCacheDirectory || originalDocumentDetails == null) {
            originalDocumentDetails
          } else {
            val copyPath = copyDocumentToCacheDirectory(uri, originalDocumentDetails.name)
            copyPath?.let {
              originalDocumentDetails.copy(uri = it)
            } ?: throw FailedToCopyToCacheException()
          }
        }?.let { details ->
          val result = Bundle().apply {
            putString("type", "success")
            putString("uri", details.uri)
            putString("name", details.name)
            details.mimeType?.let { mimeType ->
              putString("mimeType", mimeType)
            }
            details.size?.let { size ->
              putInt("size", size)
            }
          }
          promise.resolve(result)
        } ?: throw FailedToReadDocumentException()
      } else {
        promise.resolve(Bundle().apply {
          putString("type", "cancel")
        })
      }
      pendingPromise = null
    }
  }

  private fun copyDocumentToCacheDirectory(documentUri: Uri, name: String): String? {
    val outputFilePath = FileUtilities.generateOutputPath(
      context.cacheDir,
      "DocumentPicker",
      FilenameUtils.getExtension(name)
    )
    val outputFile = File(outputFilePath)
    try {
      context.contentResolver.openInputStream(documentUri).use { inputStream ->
        FileOutputStream(outputFile).use { outputStream ->
          IOUtils.copy(inputStream, outputStream)
        }
      }
    } catch (e: IOException) {
      e.printStackTrace()
      return null
    }
    return Uri.fromFile(outputFile).toString()
  }
}
