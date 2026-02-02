package expo.modules.filesystem

import android.database.Cursor
import android.database.MatrixCursor
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.provider.DocumentsContract.Document
import android.provider.DocumentsContract.Root
import android.provider.DocumentsProvider
import java.io.File

/**
 * Mock DocumentsProvider for testing SAF operations without requiring user interaction.
 * This provider uses the app's internal cache directory as its backing storage.
 */
class TestStorageProvider : DocumentsProvider() {
  companion object {
    const val AUTHORITY = "expo.modules.filesystem.test.documents"
    const val ROOT_ID = "test_root"
    const val ROOT_DOC_ID = "root_doc"
  }

  private lateinit var baseDir: File

  override fun onCreate(): Boolean {
    val cacheDir = context?.cacheDir ?: return false
    baseDir = File(cacheDir, "test_saf_root").apply {
      if (exists()) {
        deleteRecursively()
      }
      mkdirs()
    }
    android.util.Log.d("TestStorageProvider", "Initialized with baseDir: ${baseDir.absolutePath}, exists: ${baseDir.exists()}")
    return baseDir.exists() && baseDir.isDirectory
  }

  override fun queryRoots(projection: Array<out String>?): Cursor {
    val cols = projection ?: arrayOf(
      Root.COLUMN_ROOT_ID,
      Root.COLUMN_FLAGS,
      Root.COLUMN_TITLE,
      Root.COLUMN_DOCUMENT_ID,
      Root.COLUMN_ICON
    )

    return MatrixCursor(cols).apply {
      newRow().apply {
        add(Root.COLUMN_ROOT_ID, ROOT_ID)
        add(Root.COLUMN_FLAGS, Root.FLAG_SUPPORTS_CREATE or Root.FLAG_SUPPORTS_IS_CHILD)
        add(Root.COLUMN_TITLE, "Test SAF Storage")
        add(Root.COLUMN_DOCUMENT_ID, ROOT_DOC_ID)
        add(Root.COLUMN_ICON, android.R.drawable.ic_menu_manage)
      }
    }
  }

  override fun queryDocument(documentId: String, projection: Array<out String>?): Cursor {
    val cols = projection ?: arrayOf(
      Document.COLUMN_DOCUMENT_ID,
      Document.COLUMN_MIME_TYPE,
      Document.COLUMN_DISPLAY_NAME,
      Document.COLUMN_FLAGS,
      Document.COLUMN_SIZE,
      Document.COLUMN_LAST_MODIFIED
    )

    val file = getFileForDocId(documentId)
    return MatrixCursor(cols).apply {
      newRow().apply {
        add(Document.COLUMN_DOCUMENT_ID, documentId)
        add(Document.COLUMN_DISPLAY_NAME, file.name)
        add(
          Document.COLUMN_MIME_TYPE,
          if (file.isDirectory) Document.MIME_TYPE_DIR else "application/octet-stream"
        )
        add(
          Document.COLUMN_FLAGS,
          Document.FLAG_SUPPORTS_WRITE or
            Document.FLAG_SUPPORTS_DELETE or
            Document.FLAG_SUPPORTS_MOVE or
            Document.FLAG_SUPPORTS_RENAME
        )
        add(Document.COLUMN_SIZE, if (file.isFile) file.length() else 0)
        add(Document.COLUMN_LAST_MODIFIED, file.lastModified())
      }
    }
  }

  override fun queryChildDocuments(
    parentDocumentId: String,
    projection: Array<out String>?,
    sortOrder: String?
  ): Cursor {
    val cols = projection ?: arrayOf(
      Document.COLUMN_DOCUMENT_ID,
      Document.COLUMN_MIME_TYPE,
      Document.COLUMN_DISPLAY_NAME,
      Document.COLUMN_FLAGS,
      Document.COLUMN_SIZE
    )

    val parent = getFileForDocId(parentDocumentId)
    return MatrixCursor(cols).apply {
      parent.listFiles()?.forEach { file ->
        newRow().apply {
          add(Document.COLUMN_DOCUMENT_ID, getDocIdForFile(file))
          add(Document.COLUMN_DISPLAY_NAME, file.name)
          add(
            Document.COLUMN_MIME_TYPE,
            if (file.isDirectory) Document.MIME_TYPE_DIR else "text/plain"
          )
          add(
            Document.COLUMN_FLAGS,
            Document.FLAG_SUPPORTS_WRITE or Document.FLAG_SUPPORTS_DELETE
          )
          add(Document.COLUMN_SIZE, if (file.isFile) file.length() else 0)
        }
      }
    }
  }

  override fun openDocument(
    documentId: String,
    mode: String,
    signal: CancellationSignal?
  ): ParcelFileDescriptor {
    val file = getFileForDocId(documentId)
    val accessMode = ParcelFileDescriptor.parseMode(mode)
    return ParcelFileDescriptor.open(file, accessMode)
  }

  override fun createDocument(
    parentDocumentId: String,
    mimeType: String,
    displayName: String
  ): String? {
    android.util.Log.d("TestStorageProvider", "createDocument: parent=$parentDocumentId, mime=$mimeType, name=$displayName")

    val parent = getFileForDocId(parentDocumentId)
    android.util.Log.d("TestStorageProvider", "Parent file: ${parent.absolutePath}, exists=${parent.exists()}, isDir=${parent.isDirectory}")

    if (!parent.exists() || !parent.isDirectory) {
      android.util.Log.e("TestStorageProvider", "Parent doesn't exist or is not a directory")
      return null
    }

    val file = File(parent, displayName)

    val success = if (mimeType == Document.MIME_TYPE_DIR) {
      file.mkdir()
    } else {
      file.createNewFile()
    }

    if (!success) {
      android.util.Log.e("TestStorageProvider", "Failed to create file: ${file.absolutePath}")
      return null
    }

    val docId = getDocIdForFile(file)
    android.util.Log.d("TestStorageProvider", "Created document: $docId at ${file.absolutePath}")
    return docId
  }

  override fun deleteDocument(documentId: String) {
    val file = getFileForDocId(documentId)
    file.deleteRecursively()
  }

  override fun renameDocument(documentId: String, displayName: String): String? {
    val file = getFileForDocId(documentId)
    if (!file.exists()) return null

    val parent = file.parentFile ?: return null
    val newFile = File(parent, displayName)

    if (!file.renameTo(newFile)) return null
    return getDocIdForFile(newFile)
  }

  override fun moveDocument(
    sourceDocumentId: String,
    sourceParentDocumentId: String,
    targetParentDocumentId: String
  ): String? {
    val sourceFile = getFileForDocId(sourceDocumentId)
    if (!sourceFile.exists()) return null

    val targetParent = getFileForDocId(targetParentDocumentId)
    if (!targetParent.exists() || !targetParent.isDirectory) return null

    val targetFile = File(targetParent, sourceFile.name)

    if (!sourceFile.renameTo(targetFile)) return null
    return getDocIdForFile(targetFile)
  }

  override fun isChildDocument(parentDocumentId: String, documentId: String): Boolean {
    // This is crucial for tree URI validation
    if (parentDocumentId == ROOT_DOC_ID) {
      // Everything except root is a child of root
      return documentId != ROOT_DOC_ID
    }

    // Check if documentId represents a child of parentDocumentId
    return try {
      val parent = getFileForDocId(parentDocumentId)
      val child = getFileForDocId(documentId)
      child.canonicalPath.startsWith(parent.canonicalPath + File.separator)
    } catch (e: Exception) {
      false
    }
  }

  // Helper methods to map between document IDs and actual files
  private fun getFileForDocId(id: String): File {
    return when (id) {
      ROOT_DOC_ID -> baseDir
      else -> {
        // Document IDs are just relative paths from baseDir
        File(baseDir, id)
      }
    }
  }

  private fun getDocIdForFile(file: File): String {
    if (file == baseDir) return ROOT_DOC_ID

    // Document ID is the relative path from baseDir
    return file.relativeTo(baseDir).path
  }
}
