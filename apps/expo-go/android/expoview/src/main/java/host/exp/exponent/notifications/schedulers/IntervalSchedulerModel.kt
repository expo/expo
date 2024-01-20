package host.exp.exponent.notifications.schedulers

import host.exp.exponent.notifications.managers.SchedulersDatabase
import host.exp.exponent.notifications.managers.SchedulersManagerProxy
import host.exp.exponent.kernel.ExperienceKey
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
class IntervalSchedulerModel : BaseModel(), SchedulerModel {
  @Column
  @PrimaryKey(autoincrement = true)
  var id = 0

  @Column override var notificationId = 0

  @Column(name = "experienceId")
  var experienceScopeKey: String? = null

  @Column var isRepeat = false

  @Column var serializedDetails: String? = null

  @Column var scheduledTime: Long = 0

  @Column var interval: Long = 0

  override fun canBeRescheduled(): Boolean {
    return isRepeat || DateTime.now().toDate().time < scheduledTime
  }

  override fun saveAndGetId(): String {
    save() // get id from database
    val details = getDetailsMap()
    details!![SchedulersManagerProxy.SCHEDULER_ID] = idAsString
    setDetailsFromMap(details)
    save()
    return idAsString
  }

  override val ownerExperienceKey: ExperienceKey
    get() = ExperienceKey(experienceScopeKey!!)
  override val idAsString: String
    get() = Integer.valueOf(id).toString() + this.javaClass.simpleName

  override fun remove() {
    delete()
  }

  // elapsedTime
  // time when notification should be presented can be represented as (interval * t + scheduledTime)
  override val nextAppearanceTime: Long
    get() {
      var now = DateTime.now().toDate().time
      val whenShouldAppear: Long
      if (now <= scheduledTime) {
        whenShouldAppear = scheduledTime
      } else {
        require(interval > 0)
        now = DateTime.now().toDate().time
        val elapsedTime = now - scheduledTime
        val t = elapsedTime / interval + 1
        whenShouldAppear = interval * t + scheduledTime
      }
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
      Intent.ACTION_REBOOT,
      Intent.ACTION_BOOT_COMPLETED
    )
  }
}
