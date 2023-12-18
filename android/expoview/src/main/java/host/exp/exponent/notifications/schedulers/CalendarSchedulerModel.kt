package host.exp.exponent.notifications.schedulers

import host.exp.exponent.notifications.helpers.ExpoCronDefinitionBuilder
import host.exp.exponent.notifications.managers.SchedulersDatabase
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.managers.SchedulersManagerProxy
import com.cronutils.parser.CronParser
import com.cronutils.model.time.ExecutionTime
import android.content.Intent
import android.os.SystemClock
import com.raizlabs.android.dbflow.annotation.Column
import com.raizlabs.android.dbflow.annotation.PrimaryKey
import com.raizlabs.android.dbflow.annotation.Table
import com.raizlabs.android.dbflow.structure.BaseModel
import org.joda.time.DateTime
import org.json.JSONException
import java.util.*

@Table(database = SchedulersDatabase::class)
class CalendarSchedulerModel : BaseModel(), SchedulerModel {
  @Column
  @PrimaryKey(autoincrement = true)
  var id = 0

  @Column override var notificationId = 0

  @Column(name = "experienceId")
  var experienceScopeKey: String? = null

  @Column var isRepeat = false

  @Column var serializedDetails: String? = null

  @Column var calendarData: String? = null

  override val idAsString: String
    get() = Integer.valueOf(id).toString() + this.javaClass.simpleName
  override val ownerExperienceKey: ExperienceKey
    get() = ExperienceKey(experienceScopeKey!!)

  override fun canBeRescheduled(): Boolean {
    return isRepeat
  }

  override fun saveAndGetId(): String {
    save() // get id from database
    val details = getDetailsMap()
    details!![SchedulersManagerProxy.SCHEDULER_ID] = idAsString
    setDetailsFromMap(details)
    save()
    return idAsString
  }

  override fun remove() {
    delete()
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
