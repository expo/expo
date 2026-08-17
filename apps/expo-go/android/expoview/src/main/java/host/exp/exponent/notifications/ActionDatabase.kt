package host.exp.exponent.notifications

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase

@Dao
interface ActionDao {
  @Insert(onConflict = OnConflictStrategy.REPLACE)
  fun insert(action: ActionObject)

  @Query("SELECT * FROM ActionObject WHERE categoryId = :categoryId ORDER BY position ASC")
  fun findByCategory(categoryId: String?): List<ActionObject>

  @Query("DELETE FROM ActionObject WHERE categoryId = :categoryId")
  fun deleteByCategory(categoryId: String?)
}

@Database(entities = [ActionObject::class], version = ActionDatabase.VERSION, exportSchema = false)
abstract class ActionRoomDatabase : RoomDatabase() {
  abstract fun actionDao(): ActionDao
}

object ActionDatabase {
  const val NAME = "ExpoNotificationActions"
  const val VERSION = 2

  lateinit var dao: ActionDao
    private set

  @JvmStatic fun init(context: Context) {
    dao = Room.databaseBuilder(context, ActionRoomDatabase::class.java, "$NAME.db")
      .fallbackToDestructiveMigration() 
      .allowMainThreadQueries()
      .build()
      .actionDao()
  }
}
