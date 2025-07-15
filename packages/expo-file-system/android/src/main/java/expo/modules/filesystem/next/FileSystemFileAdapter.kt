package expo.modules.filesystem.next

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri
import androidx.documentfile.provider.DocumentFile
import java.io.File
import java.net.URI

class FileSystemFileAdapter(val context: Context, val uri: Uri) {
  val javaFile get() = File(URI.create(uri.toString()))
  val treeDocumentFile: DocumentFile? by lazy {
    DocumentFile.fromTreeUri(context, uri)
  }
  val singleDocumentFile: DocumentFile? by lazy {
    DocumentFile.fromSingleUri(context, uri)
  }

  // TODO: consider adding the SAF domain check here
  val isContentURI = uri.scheme == "content"

  fun exists(): Boolean {
    return if (isContentURI) {
      singleDocumentFile?.exists() == true
    } else {
      javaFile.exists() == true
    }
  }

  val isDirectory: Boolean get() {
    return if (isContentURI) {
      singleDocumentFile?.isDirectory == true
    } else {
      javaFile.isDirectory == true
    }
  }

  val isFile: Boolean get() {
    return if (isContentURI) {
      singleDocumentFile?.isFile == true
    } else {
      javaFile.isFile == true
    }
  }

  val parentFile: FileSystemFileAdapter? get() {
    return if (isContentURI) {
      treeDocumentFile?.parentFile?.let { FileSystemFileAdapter(context, it.uri) }
    } else {
      javaFile.parentFile?.toUri()?.let { FileSystemFileAdapter(context, it) }
    }
  }

  fun createFile(mimeType: String, displayName: String): FileSystemFileAdapter? {
    if (isContentURI) {
      val documentFile = treeDocumentFile?.createFile(mimeType, displayName)
      if (documentFile != null) {
        return FileSystemFileAdapter(context, documentFile.uri)
      }
    } else {
      val childFile = File(javaFile.parentFile, displayName)
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
      val childFile = File(javaFile.parentFile, displayName)
      childFile.mkdir()
      return FileSystemFileAdapter(context, childFile.toUri())
    }
    return null
  }

  fun delete(): Boolean {
    return if (isContentURI) {
      singleDocumentFile?.delete() == true
    } else {
      javaFile.delete()
    }
  }

  fun listFiles(): List<FileSystemFileAdapter> {
    return if (isContentURI) {
      treeDocumentFile?.listFiles()?.map {
        FileSystemFileAdapter(context, it.uri)
      } ?: emptyList()
    } else {
      javaFile.listFiles()?.map {
        FileSystemFileAdapter(context, it.toUri())
      } ?: emptyList()
    }
  }
}
