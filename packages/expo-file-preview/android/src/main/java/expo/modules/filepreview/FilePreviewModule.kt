package expo.modules.filepreview

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.services.FilePermissionService
import java.io.File
import java.net.URLConnection

class FilePreviewModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoFilePreview")

    AsyncFunction("canPreviewAsync") { uri: String, options: FilePreviewCanPreviewOptions ->
      val file = getLocalFileForUri(uri)
      val contentUri = createContentUri(file)
      val mimeType = resolveMimeType(file, options.mimeType)
      canHandle(createPreviewIntent(contentUri, mimeType))
    }

    AsyncFunction("openPreviewAsync") { uri: String, options: FilePreviewOpenOptions ->
      val file = getLocalFileForUri(uri)
      val contentUri = createContentUri(file)
      val mimeType = resolveMimeType(file, options.mimeType)
      val previewIntent = createPreviewIntent(contentUri, mimeType)

      grantReadPermissions(previewIntent, contentUri)

      try {
        appContext.throwingActivity.startActivity(previewIntent)
      } catch (_: ActivityNotFoundException) {
        throw FilePreviewUnsupportedException(mimeType)
      } catch (cause: Throwable) {
        throw FilePreviewFailedException("Failed to open the file preview: ${cause.message}", cause)
      }
    }
  }

  private fun getLocalFileForUri(uriString: String): File {
    val uri = Uri.parse(uriString)
    if (uri.scheme != "file") {
      throw FilePreviewInvalidUriException("Only local file URIs are supported (expected scheme to be 'file', got '${uri.scheme}').")
    }
    val path = uri.path ?: throw FilePreviewInvalidUriException("Path component of the file URI cannot be null.")
    val file = File(path)
    if (!isSupportedLocalFile(file)) {
      throw FilePreviewPermissionException()
    }
    if (!isAllowedToRead(path)) {
      throw FilePreviewPermissionException()
    }
    return file
  }

  private fun isAllowedToRead(path: String): Boolean {
    return appContext.filePermission
      .getPathPermissions(context, path)
      .contains(FilePermissionService.Permission.READ)
  }

  private fun isSupportedLocalFile(file: File): Boolean {
    if (!file.isFile || !file.canRead()) {
      return false
    }

    return runCatching {
      val canonicalPath = file.canonicalPath
      listOf(context.filesDir, context.cacheDir).any { root ->
        val rootPath = root.canonicalPath
        canonicalPath == rootPath || canonicalPath.startsWith("$rootPath/")
      }
    }.getOrDefault(false)
  }

  private fun createContentUri(file: File): Uri {
    return FileProvider.getUriForFile(
      context,
      context.applicationInfo.packageName + ".FilePreviewFileProvider",
      file
    )
  }

  private fun resolveMimeType(file: File, mimeType: String?): String {
    return mimeType
      ?: URLConnection.guessContentTypeFromName(file.name)
      ?: "application/octet-stream"
  }

  private fun createPreviewIntent(uri: Uri, mimeType: String): Intent {
    return Intent(Intent.ACTION_VIEW).apply {
      setDataAndTypeAndNormalize(uri, mimeType)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
  }

  private fun canHandle(intent: Intent): Boolean {
    return context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY).isNotEmpty()
  }

  private fun grantReadPermissions(intent: Intent, uri: Uri) {
    context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY).forEach {
      context.grantUriPermission(it.activityInfo.packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
  }
}
