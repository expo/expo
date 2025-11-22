package expo.modules.filesystem.unifiedfile

import android.content.Context
import android.net.Uri
import android.webkit.MimeTypeMap
import androidx.core.net.toUri
import expo.modules.kotlin.AppContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream

class AssetFile(private val context: Context, override val uri: Uri) : UnifiedFileInterface {
  val path: String = uri.path?.trimStart('/') ?: throw IllegalArgumentException("Invalid asset URI: $uri")

  override fun exists(): Boolean = isDirectory() || isFile()

  override fun isDirectory(): Boolean {
    return context.assets.list(path)?.isNotEmpty() == true
  }

  override fun isFile(): Boolean {
    return runCatching {
      context.assets.open(path).use { true }
    }.getOrElse {
      false
    }
  }

  // Cache the content URI to avoid redundant file writes – assets are read-only
  var contentUri: Uri? = null
  override fun getContentUri(appContext: AppContext): Uri {
    inputStream().use { inputStream ->
      val outputFile = File(context.cacheDir, "expo_shared_assets/$fileName")
      outputFile.parentFile?.mkdirs() // Create directories if needed
      FileOutputStream(outputFile).use { outputStream ->
        inputStream.copyTo(outputStream)
      }
      val newContentUri = JavaFile(outputFile.toUri()).getContentUri(appContext)
      contentUri = newContentUri
      return newContentUri
    }
  }

  override val parentFile: UnifiedFileInterface?
    get() {
      val currentPath = uri.path.orEmpty()
      if (currentPath.isEmpty()) {
        return null
      }

      val parentPath = currentPath.substringBeforeLast('/')
      val parentUri = "asset://$parentPath".toUri()

      return AssetFile(context, parentUri)
    }

  override fun createFile(mimeType: String, displayName: String): UnifiedFileInterface? {
    throw UnsupportedOperationException("Asset files are not writable and cannot be created")
  }

  override fun createDirectory(displayName: String): UnifiedFileInterface? {
    throw UnsupportedOperationException("Asset directories are not writable and cannot be created")
  }

  override fun delete(): Boolean = throw UnsupportedOperationException("Asset files are not writable and cannot be deleted")

  override fun deleteRecursively(): Boolean = throw UnsupportedOperationException("Asset files are not writable and cannot be deleted")

  override fun listFilesAsUnified(): List<UnifiedFileInterface> {
    val list = context.assets.list(path)
    return list?.map { name -> AssetFile(context, File(path, name).toUri()) as UnifiedFileInterface } ?: emptyList()
  }

  override val type: String?
    get() {
      val extension = MimeTypeMap.getFileExtensionFromUrl(uri.toString())
      return if (extension.isNotEmpty()) {
        MimeTypeMap
          .getSingleton()
          .getMimeTypeFromExtension(extension.lowercase())
      } else {
        null
      }
    }

  override fun lastModified(): Long? {
    return null
  }

  override val fileName: String?
    get() = uri.lastPathSegment

  override val creationTime: Long? get() {
    return null
  }

  override fun outputStream(): OutputStream {
    throw UnsupportedOperationException("Asset files are not writable")
  }

  override fun inputStream(): InputStream {
    return context.assets.open(path)
  }

  override fun length(): Long {
    runCatching {
      context.assets.openFd(path).use { assetFileDescriptor ->
        val length = assetFileDescriptor.length
        if (length > 0) {
          return length
        }
      }
    }
    runCatching {
      var size: Long = 0
      context.assets.open(path).use { inputStream ->
        val buffer = ByteArray(8192)
        var read: Int
        while (inputStream.read(buffer).also { read = it } != -1) {
          size += read
        }
      }
      return size
    }
    return 0
  }

  override fun walkTopDown(): Sequence<AssetFile> = sequence {
    yield(this@AssetFile)
    if (isDirectory()) {
      val assets = context.assets.list(path)
      assets?.forEach { assetName ->
        val childUri = "$uri/$assetName".replace("//", "/").toUri()
        val childFile = AssetFile(context, childUri)
        yieldAll(childFile.walkTopDown())
      }
    }
  }
}
