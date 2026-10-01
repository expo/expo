package expo.modules.observe.storage

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * If this fails, the Room schema changed, and installed apps lose unsent data: Room drops the
 * database on an identity mismatch (`fallbackToDestructiveMigration`).
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class MetricsDatabaseIdentityTest {
  @Test
  fun `schema identity hash and version are unchanged`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    try {
      val readableDatabase = database.openHelper.readableDatabase
      val identityHash = readableDatabase
        .query("SELECT identity_hash FROM room_master_table")
        .use { cursor ->
          cursor.moveToFirst()
          cursor.getString(0)
        }
      assertEquals(EXPECTED_IDENTITY_HASH, identityHash)
      assertEquals(EXPECTED_VERSION, readableDatabase.version)
    } finally {
      database.close()
    }
  }

  private companion object {
    const val EXPECTED_IDENTITY_HASH = "0cc0ddc256082f15861e061846d22bc5"
    const val EXPECTED_VERSION = 18
  }
}
