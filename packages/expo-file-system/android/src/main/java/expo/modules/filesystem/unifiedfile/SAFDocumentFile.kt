package expo.modules.filesystem.unifiedfile

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import java.io.InputStream
import java.io.OutputStream

class SAFDocumentFile(private val context: Context, override val uri: Uri) : UnifiedFileInterface {
  private val documentFile: DocumentFile?
    get() {
      // Relying on singleUri.isDirectory did not work, and there's no explicit method for this, so we check path
      val pathSegment = uri.pathSegments.getOrNull(0) ?: "tree"
      if (pathSegment == "document") {
        // If the path starts with "document", we treat it as a raw file URI
        return DocumentFile.fromSingleUri(context, uri)
      } else {
        // Otherwise, we treat it as a tree URI
        return DocumentFile.fromTreeUri(context, uri)
      }
    }

  override fun exists(): Boolean = documentFile?.exists() == true

  override fun isDirectory(): Boolean {
    return documentFile?.isDirectory == true
  }

  override fun isFile(): Boolean {
    return documentFile?.isFile == true
  }

  override val parentFile: UnifiedFileInterface?
    get() = documentFile?.parentFile?.uri?.let { SAFDocumentFile(context, it) }

  override fun createFile(mimeType: String, displayName: String): UnifiedFileInterface? {
    val documentFile = documentFile?.createFile(mimeType, displayName)
    return documentFile?.uri?.let { SAFDocumentFile(context, it) }
  }

  override fun createDirectory(displayName: String): UnifiedFileInterface? {
    val documentFile = documentFile?.createDirectory(displayName)
    return documentFile?.uri?.let { SAFDocumentFile(context, it) }
  }

  override fun delete(): Boolean = documentFile?.delete() == true

  override fun listFilesAsUnified(): List<UnifiedFileInterface> =
    documentFile?.listFiles()?.map { SAFDocumentFile(context, it.uri) } ?: emptyList()

  override val type: String?
    get() = documentFile?.type

  override fun lastModified(): Long? {
    return documentFile?.lastModified()
  }

  override val fileName: String?
    get() = documentFile?.name

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
    return documentFile?.length() ?: 0
  }

  override fun walkTopDown(): Sequence<SAFDocumentFile> {
    return sequence {
      yield(this@SAFDocumentFile)
      if (isDirectory()) {
        documentFile?.listFiles()?.forEach { child ->
          yieldAll(SAFDocumentFile(context, child.uri).walkTopDown())
        }
      }
    }
  }
}
