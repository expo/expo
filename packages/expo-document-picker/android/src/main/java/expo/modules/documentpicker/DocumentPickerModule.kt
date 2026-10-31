package expo.modules.documentpicker

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.FileUtils
import com.facebook.react.bridge.ActivityEventListener
import expo.modules.core.utilities.FileUtilities
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.apache.commons.io.FilenameUtils
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume

private const val OPEN_DOCUMENT_CODE = 4137

private class OpenDocumentResult(val resultCode: Int, val data: Intent?)

@ExpoModule("ExpoDocumentPicker")
class DocumentPickerModule : Module() {
  private val pendingResult = AtomicReference<CancellableContinuation<OpenDocumentResult>?>(null)

  private val activityEventListener = object : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != OPEN_DOCUMENT_CODE) {
        return
      }
      pendingResult.getAndSet(null)?.resume(OpenDocumentResult(resultCode, data))
    }

    override fun onNewIntent(intent: Intent) = Unit
  }

  override fun onDestroy() {
    reactContextOrNull?.removeActivityEventListener(activityEventListener)
  }

  @JS
  suspend fun getDocumentAsync(options: DocumentPickerOptions): DocumentPickerResult {
    if (options.type.isEmpty()) {
      throw DocumentPickerOptionsEmptyListException()
    }

    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      putExtra(Intent.EXTRA_ALLOW_MULTIPLE, options.multiple)
      type = if (options.type.size > 1) {
        putExtra(Intent.EXTRA_MIME_TYPES, options.type.toTypedArray())
        "*/*"
      } else {
        options.type[0]
      }
    }

    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    reactContext.addActivityEventListener(activityEventListener)

    val result = suspendCancellableCoroutine { continuation ->
      if (!pendingResult.compareAndSet(null, continuation)) {
        throw PickingInProgressException()
      }
      continuation.invokeOnCancellation { pendingResult.compareAndSet(continuation, null) }

      try {
        activity.startActivityForResult(intent, OPEN_DOCUMENT_CODE)
      } catch (e: Throwable) {
        pendingResult.compareAndSet(continuation, null)
        throw e
      }
    }

    if (result.resultCode != Activity.RESULT_OK) {
      return DocumentPickerResult(canceled = true)
    }

    return withContext(Dispatchers.IO) {
      try {
        if (result.data?.clipData != null) {
          handleMultipleSelection(result.data, options.copyToCacheDirectory)
        } else {
          handleSingleSelection(result.data, options.copyToCacheDirectory)
        }
      } catch (e: Exception) {
        throw e.toCodedException()
      }
    }
  }

  private fun copyDocumentToCacheDirectory(documentUri: Uri, name: String): Uri {
    val outputFilePath = FileUtilities.generateOutputPath(
      androidContext.cacheDir,
      "DocumentPicker",
      FilenameUtils.getExtension(name)
    )
    val outputFile = File(outputFilePath)
    androidContext.contentResolver.openInputStream(documentUri).use { inputStream ->
      inputStream ?: throw FileNotFoundException("InputStream for $documentUri was null.")
      FileOutputStream(outputFile).use { outputStream ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          FileUtils.copy(inputStream, outputStream)
        } else {
          inputStream.copyTo(outputStream)
        }
      }
    }
    return Uri.fromFile(outputFile)
  }

  private fun handleSingleSelection(intent: Intent?, copyToCacheDirectory: Boolean): DocumentPickerResult {
    val uri = intent?.data ?: throw FailedToReadDocumentException()
    return DocumentPickerResult(
      assets = listOf(readDocumentDetails(uri, copyToCacheDirectory))
    )
  }

  private fun handleMultipleSelection(intent: Intent?, copyToCacheDirectory: Boolean): DocumentPickerResult {
    val count = intent?.clipData?.itemCount ?: 0
    val assets = mutableListOf<DocumentInfo>()

    for (i in 0 until count) {
      val uri = intent?.clipData?.getItemAt(i)?.uri
        ?: throw FailedToReadDocumentException()
      val document = readDocumentDetails(uri, copyToCacheDirectory)
      assets.add(document)
    }

    return DocumentPickerResult(assets = assets)
  }

  private fun readDocumentDetails(uri: Uri, copyToCacheDirectory: Boolean): DocumentInfo {
    val originalDocumentDetails = DocumentDetailsReader(androidContext).read(uri)

    val details = if (!copyToCacheDirectory) {
      originalDocumentDetails
    } else {
      val copyPath = copyDocumentToCacheDirectory(uri, originalDocumentDetails.name)
      originalDocumentDetails.copy(uri = copyPath.toString())
    }

    return details
  }
}
