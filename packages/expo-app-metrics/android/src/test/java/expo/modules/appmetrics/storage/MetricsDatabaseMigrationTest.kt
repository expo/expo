package expo.modules.appmetrics.storage

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class MetricsDatabaseMigrationTest {
  @Test
  fun `migration 16 to 17 creates the spans table and preserves existing data`() = runTest {
    // Schema export is off, so Room's MigrationTestHelper isn't available. Instead, rewind a
    // current-version database to the pre-migration shape by hand: drop `spans` and set the
    // schema version back to 16. Reopening then runs MIGRATION_16_17, and Room validates the
    // migrated table against the entity at open — wrong DDL fails this test loudly.
    val context = ApplicationProvider.getApplicationContext<Context>()
    val name = "migration-test.db"
    context.deleteDatabase(name)
    val fresh = Room
      .databaseBuilder(context, MetricsDatabase::class.java, name)
      .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
      .allowMainThreadQueries()
      .build()
    fresh.sessionDao().insert(Session(id = "s", startTimestamp = "2026-08-13T10:00:00.000Z"))
    fresh.close()
    SQLiteDatabase
      .openDatabase(context.getDatabasePath(name).path, null, SQLiteDatabase.OPEN_READWRITE)
      .use { raw ->
        raw.execSQL("DROP TABLE `spans`")
        raw.execSQL("PRAGMA user_version = 16")
      }
    val migrated = Room
      .databaseBuilder(context, MetricsDatabase::class.java, name)
      .addMigrations(MIGRATION_16_17)
      .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
      .allowMainThreadQueries()
      .build()
    try {
      // The session survived: the destructive fallback would have wiped it.
      assertEquals("s", migrated.sessionDao().getById("s")?.id)
      // The migrated table is fully usable, not just present.
      migrated.spanDao().insert(Span(sessionId = "s", name = "GET", startTimestampMs = 1, endTimestampMs = 2))
      assertEquals(1, migrated.spanDao().getAll().size)
    } finally {
      migrated.close()
      context.deleteDatabase(name)
    }
  }
}
