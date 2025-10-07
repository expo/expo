package expo.modules.filesystem.unifiedfile

import android.net.Uri
import android.os.Build
import android.webkit.MimeTypeMap
import androidx.core.net.toUri
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.net.URI
import java.nio.file.attribute.BasicFileAttributes
import kotlin.io.path.Path
import kotlin.io.path.readAttributes
import kotlin.time.Duration.Companion.milliseconds

class JavaFile(override val uri: Uri) : UnifiedFileInterface, File(URI.create(uri.toString())) {
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

  override fun deleteRecursively(): Boolean {
    if (isDirectory) {
      listFiles()?.forEach { it.deleteRecursively() }
    }
    return super<File>.delete()
  }

  override fun listFilesAsUnified(): List<UnifiedFileInterface> =
    super<File>.listFiles()?.map { JavaFile(it.toUri()) } ?: emptyList()

  override val type: String? get() {
    return MimeTypeMap.getFileExtensionFromUrl(path)
      ?.run { MimeTypeMap.getSingleton().getMimeTypeFromExtension(lowercase()) }
  }

  override val fileName: String?
    get() = super<File>.name

  override val creationTime: Long? get() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val attributes = Path(path).readAttributes<BasicFileAttributes>()
      return attributes.creationTime().toMillis().milliseconds.inWholeMilliseconds
    } else {
      return null
    }
  }

  override fun outputStream(): OutputStream {
    return FileOutputStream(this)
  }

  override fun inputStream(): InputStream {
    return FileInputStream(this)
  }

  override fun walkTopDown(): Sequence<JavaFile> {
    return walk(direction = FileWalkDirection.TOP_DOWN).map { JavaFile(it.toUri()) }
  }
}
