package expo.modules.documentpicker

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import org.apache.commons.io.FilenameUtils
import org.apache.commons.io.IOUtils
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.ModuleRegistryDelegate
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityEventListener
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.services.UIManager
import org.unimodules.core.utilities.FileUtilities
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

private const val TAG = "ExpoDocumentPicker"
private const val OPEN_DOCUMENT_CODE = 4137

class DocumentPickerModule(
  mContext: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate(),
) : ExportedModule(mContext), ActivityEventListener {
  private var mPromise: Promise? = null
  private var mCopyToCacheDirectory = true

  private val mActivityProvider: ActivityProvider by moduleRegistry()
  private val mUIManager: UIManager by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun getName() = TAG

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    mUIManager.registerActivityEventListener(this)
  }

  @ExpoMethod
  fun getDocumentAsync(options: Map<String, Any?>, promise: Promise) {
    if (mPromise != null) {
      promise.reject("E_DOCUMENT_PICKER", "Different document picking in progress. Await other document picking first.")
      return
    }

    val pickerOptions = DocumentPickerOptions.optionsFromMap(options, promise) ?: return

    mPromise = promise
    mCopyToCacheDirectory = pickerOptions.copyToCacheDirectory

    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = pickerOptions.type
    }

    mActivityProvider.currentActivity.startActivityForResult(intent, OPEN_DOCUMENT_CODE)
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
    if (requestCode != OPEN_DOCUMENT_CODE) {
      return
    }

    if (mPromise == null) {
      return
    }
    val promise = mPromise!!
    mPromise = null

    if (resultCode == Activity.RESULT_OK) {
      val documentDetails = intent?.data?.let { uri ->
        val originalDocumentDetails = DocumentDetailsReader(context).read(uri)
        if (!mCopyToCacheDirectory || originalDocumentDetails == null) {
          originalDocumentDetails
        } else {
          val copyPath = copyDocumentToCacheDirectory(uri, originalDocumentDetails.name)
          if (copyPath == null) {
            promise.reject("E_DOCUMENT_PICKER", "Failed to copy to cache directory.")
            return
          } else {
            originalDocumentDetails.copy(uri = copyPath)
          }
        }
      }

      if (documentDetails == null) {
        promise.reject("E_DOCUMENT_PICKER", "Failed to read the selected document.")
      } else {
        val result = Bundle().apply {
          putString("type", "success")
          putString("uri", documentDetails.uri)
          putString("name", documentDetails.name)
          if (documentDetails.size == null) {
            putParcelable("size", null)
          } else {
            putInt("size", documentDetails.size)
          }
        }
        promise.resolve(result)
      }
    } else {
      val result = Bundle().apply {
        putString("type", "cancel")
      }
      promise.resolve(result)
    }
  }

  override fun onNewIntent(intent: Intent) = Unit

  private fun copyDocumentToCacheDirectory(documentUri: Uri, name: String): String? {
    val outputFilePath = FileUtilities.generateOutputPath(
      context.cacheDir,
      "DocumentPicker",
      FilenameUtils.getExtension(name)
    )

    try {
      context.contentResolver.openInputStream(documentUri).use { inputStream ->
        FileOutputStream(File(outputFilePath)).use { outputStream ->
          IOUtils.copy(inputStream, outputStream)
        }
      }
    } catch (e: IOException) {
      e.printStackTrace()
      return null
    }

    return outputFilePath
  }
}
