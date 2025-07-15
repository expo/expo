package expo.modules.filesystem.next

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri
import androidx.documentfile.provider.DocumentFile
import java.io.File
import java.net.URI

class FileSystemFileAdapter(val context: Context, val uri: Uri) {
  // TODO: consider adding the SAF domain check here
  val isContentURI = uri.scheme == "content"

  var javaFile: File? = null
  var treeDocumentFile: DocumentFile? = null
  var singleDocumentFile: DocumentFile? = null

  init {
    if (isContentURI) {
      treeDocumentFile = DocumentFile.fromTreeUri(context, uri)
      singleDocumentFile = DocumentFile.fromSingleUri(context, uri)
    } else {
      javaFile = File(URI.create(uri.toString()))
    }
  }

  fun exists(): Boolean {
    return if (isContentURI) {
      singleDocumentFile?.exists() == true
    } else {
      javaFile?.exists() == true
    }
  }

  val isDirectory: Boolean get() {
    return if (isContentURI) {
      singleDocumentFile?.isDirectory == true
    } else {
      javaFile?.isDirectory == true
    }
  }

  val isFile: Boolean get() {
    return if (isContentURI) {
      singleDocumentFile?.isFile == true
    } else {
      javaFile?.isFile == true
    }
  }

  val parentFile: FileSystemFileAdapter? get() {
    return if (isContentURI) {
      treeDocumentFile?.parentFile?.let { FileSystemFileAdapter(context, it.uri) }
    } else {
      javaFile?.parentFile?.toUri()?.let { FileSystemFileAdapter(context, it) }
    }
  }

  fun createFile(mimeType: String, displayName: String): FileSystemFileAdapter? {
    if (isContentURI) {
      val documentFile = treeDocumentFile?.createFile(mimeType, displayName)
      if (documentFile != null) {
        return FileSystemFileAdapter(context, documentFile.uri)
      }
    } else {
      val childFile = File(javaFile?.parentFile, displayName)
      childFile.createNewFile()
      return FileSystemFileAdapter(context, childFile.toUri())
    }
    return null
  }

  fun createDirectory(displayName: String): FileSystemFileAdapter? {
    if (isContentURI) {
      val documentFile = treeDocumentFile?.createDirectory(displayName)
      if (documentFile != null) {
        return FileSystemFileAdapter(context, documentFile.uri)
      }
    } else {
      val childFile = File(javaFile?.parentFile, displayName)
      childFile.mkdir()
      return FileSystemFileAdapter(context, childFile.toUri())
    }
    return null
  }

  fun delete(): Boolean {
    return if (isContentURI) {
      singleDocumentFile?.delete() == true
    } else {
      javaFile?.delete() == true
    }
  }

  fun listFiles(): List<FileSystemFileAdapter> {
    return if (isContentURI) {
      treeDocumentFile?.listFiles()?.map {
        FileSystemFileAdapter(context, it.uri)
      } ?: emptyList()
    } else {
      javaFile?.listFiles()?.map {
        FileSystemFileAdapter(context, it.toUri())
      } ?: emptyList()
    }
  }
}
