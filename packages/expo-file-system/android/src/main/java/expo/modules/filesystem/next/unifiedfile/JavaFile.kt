package expo.modules.filesystem.next.unifiedfile

import android.net.Uri
import androidx.core.net.toUri
import java.io.File
import java.net.URI

class JavaFile(override val uri: Uri) : UnifiedFileInterface, File(URI.create(uri.toString())) {
  override fun isDirectory(): Boolean {
    return super<File>.isDirectory()
  }

  override fun isFile(): Boolean {
    return super<File>.isFile()
  }

  override val parentFile: UnifiedFileInterface?
    get() = super<File>.parentFile?.toUri()?.let { JavaFile(it) }

  override fun createFile(mimeType: String, displayName: String): UnifiedFileInterface? {
    val childFile = File(super<File>.parentFile, displayName)
    childFile.createNewFile()
    return JavaFile(childFile.toUri())
  }

  override fun createDirectory(displayName: String): UnifiedFileInterface? {
    val childFile = File(super<File>.parentFile, displayName)
    childFile.mkdir()
    return JavaFile(childFile.toUri())
  }

  override fun listFilesAsUnified(): List<UnifiedFileInterface> =
    super<File>.listFiles()?.map { JavaFile(it.toUri()) } ?: emptyList()
}
