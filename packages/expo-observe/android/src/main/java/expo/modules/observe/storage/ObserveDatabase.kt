package expo.modules.observe.storage

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase

@Entity(tableName = "pending_metrics")
data class PendingMetric(
  @PrimaryKey val metricId: String,
  // ISO 8601 timestamp
  val addedAt: String
)

@Entity(tableName = "pending_logs")
data class PendingLog(
  @PrimaryKey val logId: String,
  // ISO 8601 timestamp
  val addedAt: String
)

@Dao
interface PendingMetricDao {
  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insertAll(metrics: List<PendingMetric>)

  @Query("SELECT metricId FROM pending_metrics")
  suspend fun getAllMetricIds(): List<String>

  @Query("DELETE FROM pending_metrics WHERE metricId IN (:metricIds)")
  suspend fun deleteByIds(metricIds: List<String>)

  @Query("DELETE FROM pending_metrics WHERE addedAt < :cutoffTimestamp")
  suspend fun deleteOlderThan(cutoffTimestamp: String)
}

@Dao
interface PendingLogDao {
  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insertAll(logs: List<PendingLog>)

  @Query("SELECT logId FROM pending_logs")
  suspend fun getAllLogIds(): List<String>

  @Query("DELETE FROM pending_logs WHERE logId IN (:logIds)")
  suspend fun deleteByIds(logIds: List<String>)

  @Query("DELETE FROM pending_logs WHERE addedAt < :cutoffTimestamp")
  suspend fun deleteOlderThan(cutoffTimestamp: String)
}

@Database(entities = [PendingMetric::class, PendingLog::class], version = 2, exportSchema = false)
abstract class ObserveDatabase : RoomDatabase() {
  abstract fun pendingMetricDao(): PendingMetricDao

  abstract fun pendingLogDao(): PendingLogDao

  companion object {
    @Volatile
    private var INSTANCE: ObserveDatabase? = null

    fun getDatabase(context: Context): ObserveDatabase =
      INSTANCE ?: synchronized(this) {
        INSTANCE ?: Room
          .databaseBuilder(
            context.applicationContext,
            ObserveDatabase::class.java,
            "eas_observe"
          ).fallbackToDestructiveMigration()
          .build()
          .also { INSTANCE = it }
      }
  }
}
