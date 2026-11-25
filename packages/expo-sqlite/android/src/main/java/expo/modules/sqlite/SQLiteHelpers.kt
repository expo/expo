package expo.modules.sqlite

import java.io.File
import java.io.IOException

/**
 * Deletes the database file together with its `-journal`, `-wal` and `-shm` sidecar files,
 * mirroring the behavior of Android's `SQLiteDatabase.deleteDatabase()`.
 */
@Throws(DatabaseNotFoundException::class, DeleteDatabaseFileException::class)
internal fun deleteDatabaseFiles(dbFile: File, databaseName: String) {
  if (!dbFile.exists()) {
    throw DatabaseNotFoundException(databaseName)
  }
  if (!dbFile.delete()) {
    throw DeleteDatabaseFileException(databaseName)
  }
  for (suffix in listOf("-journal", "-wal", "-shm")) {
    val sidecarFile = File(dbFile.path + suffix)
    if (sidecarFile.exists()) {
      sidecarFile.delete()
    }
  }
}

@Throws(IOException::class)
internal fun ensureDirExists(dir: File): File {
  if (!dir.isDirectory) {
    if (dir.isFile) {
      throw IOException("Path '$dir' points to a file, but must point to a directory.")
    }
    if (!dir.mkdirs()) {
      var additionalErrorMessage = ""
      if (dir.exists()) {
        additionalErrorMessage = "Path already points to a non-normal file."
      }
      if (dir.parentFile == null) {
        additionalErrorMessage = "Parent directory is null."
      }
      throw IOException("Couldn't create directory '$dir'. $additionalErrorMessage")
    }
  }
  return dir
}
