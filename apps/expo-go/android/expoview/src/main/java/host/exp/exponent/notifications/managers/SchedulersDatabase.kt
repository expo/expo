package host.exp.exponent.notifications.managers

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import host.exp.exponent.notifications.schedulers.CalendarSchedulerModel
import host.exp.exponent.notifications.schedulers.IntervalSchedulerModel

@Dao
interface SchedulersDao {
  @Query("SELECT * FROM IntervalSchedulerModel")
  fun allIntervalSchedulers(): List<IntervalSchedulerModel>

  @Query("SELECT * FROM CalendarSchedulerModel")
  fun allCalendarSchedulers(): List<CalendarSchedulerModel>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  fun insertInterval(model: IntervalSchedulerModel): Long

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  fun insertCalendar(model: CalendarSchedulerModel): Long

  @Update fun updateInterval(model: IntervalSchedulerModel)

  @Update fun updateCalendar(model: CalendarSchedulerModel)

  @Delete fun deleteInterval(model: IntervalSchedulerModel)

  @Delete fun deleteCalendar(model: CalendarSchedulerModel)
}

@Database(
  entities = [IntervalSchedulerModel::class, CalendarSchedulerModel::class],
  version = SchedulersDatabase.VERSION,
  exportSchema = false
)
abstract class SchedulersRoomDatabase : RoomDatabase() {
  abstract fun schedulersDao(): SchedulersDao
}

object SchedulersDatabase {
  const val NAME = "SchedulersDatabase"
  const val VERSION = 2

  lateinit var dao: SchedulersDao
    private set

  @JvmStatic fun init(context: Context) {
    dao = Room.databaseBuilder(context, SchedulersRoomDatabase::class.java, "$NAME.db")
      .fallbackToDestructiveMigration()
      .build()
      .schedulersDao()
  }
}
