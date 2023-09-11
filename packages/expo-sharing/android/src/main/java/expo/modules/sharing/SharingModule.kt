package expo.modules.sharing

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.net.URLConnection

class SharingModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val currentActivity
    get() = appContext.currentActivity ?: throw MissingCurrentActivityException()
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoSharing")

    AsyncFunction("shareAsync") { url: String?, params: SharingOptions, promise: Promise ->
      if (pendingPromise != null) {
        throw SharingInProgressException()
      }
      try {
        val fileToShare = getLocalFileFoUrl(url)
        val contentUri = FileProvider.getUriForFile(
          context,
          context.applicationInfo.packageName + ".SharingFileProvider",
          fileToShare
        )
        val mimeType = params.mimeType
          ?: URLConnection.guessContentTypeFromName(fileToShare.name)
          ?: "*/*"
        val intent = Intent.createChooser(
          createSharingIntent(contentUri, mimeType),
          params.dialogTitle
        )
        val resInfoList = context.packageManager.queryIntentActivities(
          intent,
          PackageManager.MATCH_DEFAULT_ONLY
        )
        resInfoList.forEach {
          val packageName = it.activityInfo.packageName
          context.grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        pendingPromise = promise
        currentActivity.startActivityForResult(intent, REQUEST_CODE)
      } catch (e: InvalidArgumentException) {
        throw SharingInvalidArgsException(e.message, e)
      } catch (e: Exception) {
        throw SharingFailedException("Failed to share the file: ${e.message}", e)
      }
    }

    OnActivityResult { _, (requestCode) ->
      if (requestCode == REQUEST_CODE && pendingPromise != null) {
        pendingPromise?.resolve(null)
        pendingPromise = null
      }
    }
  }

  @Throws(InvalidArgumentException::class)
  private fun getLocalFileFoUrl(url: String?): File {
    if (url == null) {
      throw InvalidArgumentException("URL to share cannot be null.")
    }
    val uri = Uri.parse(url)
    if ("file" != uri.scheme) {
      throw InvalidArgumentException("Only local file URLs are supported (expected scheme to be 'file', got '" + uri.scheme + "'.")
    }
    val path = uri.path
      ?: throw InvalidArgumentException("Path component of the URL to share cannot be null.")
    if (!isAllowedToRead(path)) {
      throw InvalidArgumentException("Not allowed to read file under given URL.")
    }
    return File(path)
  }

  private fun isAllowedToRead(url: String?): Boolean {
    val permissions = appContext.filePermission
    return permissions?.getPathPermissions(context, url)?.contains(Permission.READ)
      ?: false
  }

  private fun createSharingIntent(uri: Uri, mimeType: String?) =
    Intent(Intent.ACTION_SEND).apply {
      putExtra(Intent.EXTRA_STREAM, uri)
      setTypeAndNormalize(mimeType)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

  companion object {
    private const val REQUEST_CODE = 8524
  }
}
