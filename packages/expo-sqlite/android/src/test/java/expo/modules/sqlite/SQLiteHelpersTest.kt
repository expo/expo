package expo.modules.sqlite

import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class SQLiteHelpersTest {
  @get:Rule
  val tempFolder = TemporaryFolder()

  private fun createFile(name: String): File = tempFolder.newFile(name).apply { writeText("data") }

  @Test
  fun `deletes the main database file`() {
    val dbFile = createFile("test.db")

    deleteDatabaseFiles(dbFile, "test.db")

    assertFalse(dbFile.exists())
  }

  @Test
  fun `deletes journal, wal and shm sidecar files along with the database`() {
    val dbFile = createFile("test.db")
    val journalFile = createFile("test.db-journal")
    val walFile = createFile("test.db-wal")
    val shmFile = createFile("test.db-shm")

    deleteDatabaseFiles(dbFile, "test.db")

    assertFalse(dbFile.exists())
    assertFalse(journalFile.exists())
    assertFalse(walFile.exists())
    assertFalse(shmFile.exists())
  }

  @Test
  fun `keeps unrelated files intact`() {
    val dbFile = createFile("test.db")
    val otherDbFile = createFile("test2.db")
    val otherWalFile = createFile("test2.db-wal")

    deleteDatabaseFiles(dbFile, "test.db")

    assertFalse(dbFile.exists())
    assertTrue(otherDbFile.exists())
    assertTrue(otherWalFile.exists())
  }

  @Test
  fun `throws when the main database file does not exist`() {
    val dbFile = File(tempFolder.root, "missing.db")

    assertThrows(DatabaseNotFoundException::class.java) {
      deleteDatabaseFiles(dbFile, "missing.db")
    }
  }
}
