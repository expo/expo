package expo.modules.sharing

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.interfaces.filesystem.Permission
import java.io.File
import java.net.URLConnection

class SharingModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), ActivityEventListener {
  private var pendingPromise: Promise? = null
  private val uiManager: UIManager by moduleRegistry()
  override fun getName() = "ExpoSharing"

  private inline fun <reified T> moduleRegistry() =
    moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    uiManager.registerActivityEventListener(this)
  }

  override fun onDestroy() {
    uiManager.unregisterActivityEventListener(this)
  }

  @ExpoMethod
  fun shareAsync(url: String?, params: ReadableArguments, promise: Promise) {
    if (pendingPromise != null) {
      promise.reject("ERR_SHARING_MUL", "Another share request is being processed now.")
      return
    }
    try {
      val fileToShare = getLocalFileFoUrl(url)
      val contentUri = FileProvider.getUriForFile(
        context,
        context.applicationInfo.packageName + ".SharingFileProvider",
        fileToShare
      )
      val mimeType = params.getString(MIME_TYPE_OPTIONS_KEY)
        ?: URLConnection.guessContentTypeFromName(fileToShare.name)
        ?: "*/*"
      val intent = Intent.createChooser(
        createSharingIntent(contentUri, mimeType),
        params.getString(DIALOG_TITLE_OPTIONS_KEY)
      )
      val resInfoList = context.packageManager.queryIntentActivities(
        intent,
        PackageManager.MATCH_DEFAULT_ONLY
      )
      resInfoList.forEach {
        val packageName = it.activityInfo.packageName
        context.grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val activityProvider: ActivityProvider by moduleRegistry()
      activityProvider.currentActivity.startActivityForResult(intent, REQUEST_CODE)
      pendingPromise = promise
    } catch (e: InvalidArgumentException) {
      promise.reject("ERR_SHARING_URL", e.message, e)
    } catch (e: Exception) {
      promise.reject("ERR_SHARING", "Failed to share the file: " + e.message, e)
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
    val permissionModuleInterface: FilePermissionModuleInterface by moduleRegistry()
    return permissionModuleInterface.getPathPermissions(context, url).contains(Permission.READ)
  }

  private fun createSharingIntent(uri: Uri, mimeType: String?) =
    Intent(Intent.ACTION_SEND).apply {
      putExtra(Intent.EXTRA_STREAM, uri)
      setTypeAndNormalize(mimeType)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == REQUEST_CODE && pendingPromise != null) {
      pendingPromise?.resolve(null)
      pendingPromise = null
    }
  }

  override fun onNewIntent(intent: Intent) = Unit

  companion object {
    private const val REQUEST_CODE = 8524
    private const val MIME_TYPE_OPTIONS_KEY = "mimeType"
    private const val DIALOG_TITLE_OPTIONS_KEY = "dialogTitle"
  }
}
