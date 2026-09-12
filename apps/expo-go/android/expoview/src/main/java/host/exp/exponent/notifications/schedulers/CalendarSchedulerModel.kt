package host.exp.exponent.notifications.schedulers

import host.exp.exponent.notifications.helpers.ExpoCronDefinitionBuilder
import host.exp.exponent.notifications.managers.SchedulersDatabase
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.managers.SchedulersManagerProxy
import com.cronutils.parser.CronParser
import com.cronutils.model.time.ExecutionTime
import android.content.Intent
import android.os.SystemClock
import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import org.joda.time.DateTime
import org.json.JSONException
import java.util.*

@Entity(tableName = "CalendarSchedulerModel")
class CalendarSchedulerModel : SchedulerModel {
  @ColumnInfo
  @PrimaryKey(autoGenerate = true)
  var id = 0

  @ColumnInfo override var notificationId = 0

  @ColumnInfo(name = "experienceId")
  var experienceScopeKey: String? = null

  @ColumnInfo var isRepeat = false

  @ColumnInfo var serializedDetails: String? = null

  @ColumnInfo var calendarData: String? = null

  override val idAsString: String
    get() = Integer.valueOf(id).toString() + this.javaClass.simpleName
  override val ownerExperienceKey: ExperienceKey
    get() = ExperienceKey(experienceScopeKey!!)

  override fun canBeRescheduled(): Boolean {
    return isRepeat
  }

  override fun saveAndGetId(): String {
    id = SchedulersDatabase.dao.insertCalendar(this).toInt() // get id from database
    val details = getDetailsMap()
    details!![SchedulersManagerProxy.SCHEDULER_ID] = idAsString
    setDetailsFromMap(details)
    SchedulersDatabase.dao.updateCalendar(this)
    return idAsString
  }

  override fun remove() {
    SchedulersDatabase.dao.deleteCalendar(this)
  }

  // elapsedTime
  override val nextAppearanceTime: Long
    get() {
      val cronDefinition = ExpoCronDefinitionBuilder.cronDefinition
      val parser = CronParser(cronDefinition)
      val cron = parser.parse(calendarData)

      val now = DateTime.now()
      val nextExecution = ExecutionTime.forCron(cron).nextExecution(now)
      val whenShouldAppear = nextExecution.toDate().time
      val bootTime = DateTime.now().toDate().time - SystemClock.elapsedRealtime()
      return whenShouldAppear - bootTime
    }

  override fun shouldBeTriggeredByAction(action: String?): Boolean {
    return triggeringActions.contains(action)
  }

  override fun getDetailsMap(): HashMap<String, Any>? {
    return try {
      HashMapSerializer.deserialize(serializedDetails)
    } catch (e: JSONException) {
      e.printStackTrace()
      null
    }
  }

  override fun setDetailsFromMap(detailsMap: HashMap<String, Any>) {
    serializedDetails = HashMapSerializer.serialize(detailsMap)
  }

  companion object {
    private val triggeringActions = listOf(
      null,
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_REBOOT,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED
    )
  }
}
