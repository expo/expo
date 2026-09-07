package expo.modules.filesystem.unifiedfile

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri
import expo.modules.filesystem.fsops.CopyMoveStrategy
import expo.modules.kotlin.AppContext
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream

class ResourceFile(private val context: Context, override val uri: Uri) : UnifiedFileInterface {
  private val resourceName: String = uri.toString()

  private fun getResourceId(): Int {
    var resourceId = context.resources.getIdentifier(resourceName, "raw", context.packageName)
    if (resourceId == 0) {
      resourceId = context.resources.getIdentifier(resourceName, "drawable", context.packageName)
    }
    return resourceId
  }

  override fun exists(): Boolean = getResourceId() != 0

  override fun isDirectory(): Boolean = false

  override fun isFile(): Boolean = exists()

  override val parentFile: UnifiedFileInterface? = null

  override fun createFile(mimeType: String, displayName: String): UnifiedFileInterface? {
    throw UnsupportedOperationException("Resource files are not writable and cannot be created")
  }

  override fun createDirectory(displayName: String): UnifiedFileInterface? {
    throw UnsupportedOperationException("Resource directories are not writable and cannot be created")
  }

  override fun delete(): Boolean = throw UnsupportedOperationException("Resource files are not writable and cannot be deleted")

  override fun deleteRecursively(): Boolean = throw UnsupportedOperationException("Resource files are not writable and cannot be deleted")

  override fun listFilesAsUnified(): List<UnifiedFileInterface> = emptyList()

  override val type: String? = null

  override fun lastModified(): Long? = null

  override val fileName: String?
    get() = resourceName

  override val creationTime: Long? = null

  override fun getContentUri(appContext: AppContext): Uri {
    inputStream().use { inputStream ->
      val outputFile = File(context.cacheDir, "expo_shared_resources/$resourceName")
      outputFile.parentFile?.mkdirs()
      FileOutputStream(outputFile).use { outputStream ->
        inputStream.copyTo(outputStream)
      }
      val newContentUri = JavaFile(outputFile.toUri()).getContentUri(appContext)
      return newContentUri
    }
  }

  override fun outputStream(append: Boolean): OutputStream {
    throw UnsupportedOperationException("Resource files are not writable")
  }

  override fun inputStream(): InputStream {
    val resourceId = getResourceId()
    if (resourceId == 0) {
      throw FileNotFoundException("No resource found with the name '$resourceName'")
    }
    return context.resources.openRawResource(resourceId)
  }

  override fun length(): Long {
    return runCatching {
      inputStream().use { it.available().toLong() }
    }.getOrElse { 0L }
  }

  override fun walkTopDown(): Sequence<UnifiedFileInterface> = sequenceOf(this)

  override val copyMoveStrategy: CopyMoveStrategy = CopyMoveStrategy.Resource(this)
}
