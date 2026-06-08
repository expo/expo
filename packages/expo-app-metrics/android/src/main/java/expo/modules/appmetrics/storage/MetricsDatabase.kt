package expo.modules.appmetrics.storage

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.Index
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.ForeignKey
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Embedded
import androidx.room.Relation
import androidx.room.Transaction
import kotlinx.serialization.Serializable
import java.util.UUID

object MetricsConstants {
  const val SECONDS_TO_REMOVE_OLD_METRICS: Long = 7 * 24 * 60 * 60 // 7 days in seconds
}

@Database(
  entities = [Metric::class, LogRecord::class, Session::class],
  version = 15,
  exportSchema = false
)
abstract class MetricsDatabase : RoomDatabase() {
  abstract fun metricDao(): MetricDao

  abstract fun logDao(): LogDao

  abstract fun sessionDao(): SessionDao

  companion object {
    @Volatile
    private var INSTANCE: MetricsDatabase? = null

    fun getDatabase(context: android.content.Context): MetricsDatabase =
      INSTANCE ?: synchronized(this) {
        val instance = Room
          .databaseBuilder(
            context.applicationContext,
            MetricsDatabase::class.java,
            "app_metrics"
          )
          // Allow destructive migration for schema changes during development. Replace with proper Migration if desired.
          .fallbackToDestructiveMigration()
          .build()
        INSTANCE = instance
        instance
      }
  }
}

@Entity(
  tableName = "sessions"
)
@Serializable
data class Session(
  @PrimaryKey val id: String,
  val startTimestamp: String, // ISO 8601 date string
  val endTimestamp: String? = null, // ISO 8601 date string. `null` while the session is still active.
  val isActive: Boolean = true,
  // Environment
  val environment: String? = null,
  // App Info
  val appName: String? = null,
  val appIdentifier: String? = null,
  val appVersion: String? = null,
  val appBuildNumber: String? = null,
  val appUpdateId: String? = null,
  val appUpdateRuntimeVersion: String? = null,
  // JSON-encoded Map<String, String> of update request headers
  val appUpdateRequestHeaders: String? = null,
  val appEasBuildId: String? = null,
  // Device Info
  val deviceOs: String? = null,
  val deviceOsVersion: String? = null,
  val deviceModel: String? = null,
  val deviceName: String? = null,
  // Versions
  val expoSdkVersion: String? = null,
  val reactNativeVersion: String? = null,
  val clientVersion: String? = null,
  // Other
  val languageTag: String? = null
)

@Entity(
  tableName = "metrics",
  indices = [Index("sessionId")],
  foreignKeys = [
    ForeignKey(
      entity = Session::class,
      parentColumns = ["id"],
      childColumns = ["sessionId"],
      onDelete = ForeignKey.CASCADE
    )
  ]
)
@Serializable
data class Metric(
  @PrimaryKey val metricId: String = UUID.randomUUID().toString(),
  val sessionId: String,
  // ISO 8601 date string
  val timestamp: String,
  val category: String,
  val name: String,
  val value: Double,
  val routeName: String? = null,
  val updateId: String? = null,
  // JSON string
  val params: String? = null
)

data class SessionWithMetrics(
  @Embedded val session: Session,
  @Relation(
    parentColumn = "id",
    entityColumn = "sessionId"
  )
  val metrics: List<Metric>,
  @Relation(
    parentColumn = "id",
    entityColumn = "sessionId"
  )
  val logs: List<LogRecord> = emptyList()
)

@Entity(
  tableName = "logs",
  indices = [Index("sessionId")],
  foreignKeys = [
    ForeignKey(
      entity = Session::class,
      parentColumns = ["id"],
      childColumns = ["sessionId"],
      onDelete = ForeignKey.CASCADE
    )
  ]
)
@Serializable
data class LogRecord(
  @PrimaryKey val logId: String = UUID.randomUUID().toString(),
  val sessionId: String,
  // ISO 8601 date string
  val timestamp: String,
  val name: String,
  val body: String? = null,
  // Lowercase severity case name (`trace`, `debug`, `info`, `warn`, `error`, `fatal`).
  val severity: String,
  // JSON string. Typed encoding happens at OTel time, not at storage time.
  val attributes: String? = null,
  val droppedAttributesCount: Int = 0
)

data class SessionWithLogs(
  @Embedded val session: Session,
  @Relation(
    parentColumn = "id",
    entityColumn = "sessionId"
  )
  val logs: List<LogRecord>
)

@Dao
interface MetricDao {
  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insert(metric: Metric)

  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insertAll(metrics: List<Metric>)

  @Delete
  suspend fun delete(metrics: List<Metric>)
}

@Dao
interface LogDao {
  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insertAll(logs: List<LogRecord>)

  @Delete
  suspend fun delete(logs: List<LogRecord>)

  @Query("DELETE FROM logs WHERE timestamp < :cutoffTimestamp")
  suspend fun deleteLogsOlderThan(cutoffTimestamp: String)
}

@Dao
interface SessionDao {
  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insert(session: Session)

  @Query("SELECT * FROM sessions WHERE id = :id")
  suspend fun getById(id: String): Session?

  @Query("UPDATE sessions SET isActive = 0, endTimestamp = :endTimestamp WHERE id = :id")
  suspend fun stopSessionAt(
    id: String,
    endTimestamp: String
  )

  // Stamps stale sessions as ended at `:timestamp`. Used at module creation
  // to clean up sessions left behind when the previous process died (force-quit,
  // OOM kill, crash) without an `OnActivityDestroys` callback.
  @Query("UPDATE sessions SET isActive = 0, endTimestamp = :timestamp WHERE startTimestamp < :timestamp AND endTimestamp IS NULL")
  suspend fun deactivateAllSessionsBefore(timestamp: String)

  // Drops sessions whose `startTimestamp` is older than the cutoff. Cascade
  // deletes their metrics via the foreign-key relation. Live (`isActive = 1`)
  // sessions are excluded so a long-running process doesn't lose its current
  // session out from under it.
  @Query("DELETE FROM sessions WHERE startTimestamp < :cutoffTimestamp AND isActive = 0")
  suspend fun deleteSessionsOlderThan(cutoffTimestamp: String)

  @Query("UPDATE sessions SET environment = :environment WHERE id = :id")
  suspend fun updateEnvironment(
    id: String,
    environment: String
  )

  @Query("UPDATE sessions SET environment = :environment WHERE isActive = 1")
  suspend fun updateEnvironmentForActiveSessions(environment: String)

  @Query("DELETE FROM sessions")
  suspend fun deleteAll()

  @Transaction
  @Query("SELECT * FROM sessions")
  suspend fun getAll(): List<SessionWithMetrics>

  @Transaction
  @Query("SELECT * FROM sessions WHERE isActive = 0 ORDER BY startTimestamp DESC")
  suspend fun getInactive(): List<SessionWithMetrics>

  @Transaction
  @Query("SELECT * FROM sessions WHERE id = :id")
  suspend fun getSessionWithMetricsBySessionId(id: String): SessionWithMetrics?

  @Transaction
  @Query("SELECT DISTINCT s.* FROM sessions s INNER JOIN metrics m ON s.id = m.sessionId WHERE m.metricId IN (:metricIds)")
  suspend fun getSessionsWithMetricsByMetricIds(metricIds: List<String>): List<SessionWithMetrics>

  @Transaction
  @Query("SELECT DISTINCT s.* FROM sessions s INNER JOIN logs l ON s.id = l.sessionId WHERE l.logId IN (:logIds)")
  suspend fun getSessionsWithLogsByLogIds(logIds: List<String>): List<SessionWithLogs>
}
