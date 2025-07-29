package expo.modules.filesystem.unifiedfile

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import java.io.InputStream
import java.io.OutputStream

class SAFDocumentFile(private val context: Context, override val uri: Uri) : UnifiedFileInterface {
  private val treeDocumentFile: DocumentFile? = DocumentFile.fromTreeUri(context, uri)

  override fun exists(): Boolean = treeDocumentFile?.exists() == true

  override fun isDirectory(): Boolean {
    return treeDocumentFile?.isDirectory == true
  }

  override fun isFile(): Boolean {
    return treeDocumentFile?.isFile == true
  }

  override val parentFile: UnifiedFileInterface?
    get() = treeDocumentFile?.parentFile?.uri?.let { SAFDocumentFile(context, it) }

  override fun createFile(mimeType: String, displayName: String): UnifiedFileInterface? {
    val documentFile = treeDocumentFile?.createFile(mimeType, displayName)
    return documentFile?.uri?.let { SAFDocumentFile(context, it) }
  }

  override fun createDirectory(displayName: String): UnifiedFileInterface? {
    val documentFile = treeDocumentFile?.createDirectory(displayName)
    return documentFile?.uri?.let { SAFDocumentFile(context, it) }
  }

  override fun delete(): Boolean = treeDocumentFile?.delete() == true

  override fun listFilesAsUnified(): List<UnifiedFileInterface> =
    treeDocumentFile?.listFiles()?.map { SAFDocumentFile(context, it.uri) } ?: emptyList()

  override val type: String?
    get() = treeDocumentFile?.type

  override fun lastModified(): Long? {
    return treeDocumentFile?.lastModified()
  }

  override val fileName: String?
    get() = treeDocumentFile?.name

  override val creationTime: Long? get() {
    // It seems there's no way to get this
    return null
  }

  override fun outputStream(): OutputStream {
    return context.contentResolver.openOutputStream(uri)
      ?: throw IllegalStateException("Unable to open output stream for URI: $uri")
  }

  override fun inputStream(): InputStream {
    return context.contentResolver.openInputStream(uri)
      ?: throw IllegalStateException("Unable to open output stream for URI: $uri")
  }

  override fun length(): Long {
    return treeDocumentFile?.length() ?: 0
  }

  override fun walkTopDown(): Sequence<SAFDocumentFile> {
    return sequence {
      yield(this@SAFDocumentFile)
      if (isDirectory()) {
        treeDocumentFile?.listFiles()?.forEach { child ->
          yieldAll(SAFDocumentFile(context, child.uri).walkTopDown())
        }
      }
    }
  }
}
