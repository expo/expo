package host.exp.exponent.notifications

import com.raizlabs.android.dbflow.annotation.Database

@Database(version = ActionDatabase.VERSION)
object ActionDatabase {
  const val NAME = "ExpoNotificationActions"
  const val VERSION = 1
}
