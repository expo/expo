package expo.modules.filesystem.next.unifiedfile

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile

class SAFDocumentFile(private val context: Context, override val uri: Uri) : UnifiedFileInterface {
  private val treeDocumentFile: DocumentFile? = DocumentFile.fromTreeUri(context, uri)
  private val singleDocumentFile: DocumentFile? = DocumentFile.fromSingleUri(context, uri)

  override fun exists(): Boolean = singleDocumentFile?.exists() == true

  override fun isDirectory(): Boolean {
    return singleDocumentFile?.isDirectory == true
  }

  override fun isFile(): Boolean {
    return singleDocumentFile?.isFile == true
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

  override fun delete(): Boolean = singleDocumentFile?.delete() ?: false

  override fun listFilesAsUnified(): List<UnifiedFileInterface> =
    treeDocumentFile?.listFiles()?.map { SAFDocumentFile(context, it.uri) } ?: emptyList()
}
