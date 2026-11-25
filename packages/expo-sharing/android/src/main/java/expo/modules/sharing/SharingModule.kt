package expo.modules.sharing

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ActivityEventListener
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.v2.legacyAppContext
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import io.github.expo.modules.v2.react.reactContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URLConnection
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.coroutines.resume

@ExpoModule("ExpoSharing")
class SharingModule : Module() {
  private val isSharing = AtomicBoolean(false)

  /**
   * Opens the share sheet and resolves when the user closes it.
   */
  @JS
  suspend fun shareAsync(url: String?, params: SharingOptions) {
    if (!isSharing.compareAndSet(false, true)) {
      throw SharingInProgressException()
    }
    try {
      withContext(Dispatchers.IO) {
        try {
          startChooserAndAwaitResult(createChooserIntent(url, params))
        } catch (e: InvalidArgumentException) {
          throw SharingInvalidArgsException(e.message, e)
        } catch (e: CancellationException) {
          throw e
        } catch (e: Exception) {
          throw SharingFailedException("Failed to share the file: ${e.message}", e)
        }
      }
    } finally {
      isSharing.set(false)
    }
  }

  @JS
  private fun getSharedPayloads(): List<SharePayload> {
    val intent = SharingSingleton.intent ?: return emptyList()
    return SimpleShareIntentDataParser.parse(androidContext, intent)
  }

  @JS
  suspend fun getResolvedSharedPayloadsAsync(): List<ResolvedSharePayload> =
    withContext(Dispatchers.IO) {
      val intent = SharingSingleton.intent ?: return@withContext emptyList()
      ResolvingShareIntentDataParser.parse(androidContext, intent)
    }

  @JS
  fun clearSharedPayloads() {
    SharingSingleton.intent = null
    ShareIntoFileStore(androidContext.cacheDir).removeAll()
  }

  private fun createChooserIntent(url: String?, params: SharingOptions): Intent {
    val context = androidContext
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
    return intent
  }

  /**
   * Starts the chooser and waits for its result, which the activity hands to the React context. A
   * listener on the React context, unlike one on the activity result registry, still gets the result
   * when Android recreates the activity while the chooser is open.
   */
  private suspend fun startChooserAndAwaitResult(intent: Intent) {
    val reactContext = reactContext
    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    suspendCancellableCoroutine { continuation ->
      val listener = object : ActivityEventListener {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
          if (requestCode == REQUEST_CODE) {
            reactContext.removeActivityEventListener(this)
            continuation.resume(Unit)
          }
        }

        override fun onNewIntent(intent: Intent) = Unit
      }
      reactContext.addActivityEventListener(listener)
      continuation.invokeOnCancellation { reactContext.removeActivityEventListener(listener) }
      try {
        activity.startActivityForResult(intent, REQUEST_CODE)
      } catch (e: Exception) {
        reactContext.removeActivityEventListener(listener)
        throw e
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
    val permissions = legacyAppContext.filePermission
    if (url == null) {
      return false
    }

    return permissions
      .getPathPermissions(androidContext, url)
      .contains(FilePermissionService.Permission.READ)
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
