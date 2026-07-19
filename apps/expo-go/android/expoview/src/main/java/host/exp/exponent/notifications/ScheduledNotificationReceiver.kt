package host.exp.exponent.notifications

import android.content.BroadcastReceiver
import android.content.Context
import javax.inject.Inject
import host.exp.exponent.ExponentManifest
import android.content.Intent
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.notifications.managers.SchedulersManagerProxy
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import java.lang.Exception
import java.util.HashMap

class ScheduledNotificationReceiver : BroadcastReceiver() {
  @Inject
  lateinit var exponentManifest: ExponentManifest

  override fun onReceive(context: Context, intent: Intent) {
    val bundle = intent.extras
    val details = bundle!!.getSerializable(KernelConstants.NOTIFICATION_OBJECT_KEY) as HashMap<*, *>?
    val notificationId = bundle.getInt(KernelConstants.NOTIFICATION_ID_KEY, 0)
    val schedulerId = details!![SchedulersManagerProxy.SCHEDULER_ID] as String?

    SchedulersManagerProxy.getInstance(context).rescheduleOrDelete(schedulerId)

    NotificationHelper.showNotification(
      context,
      notificationId,
      details,
      exponentManifest,
      object : NotificationHelper.Listener {
        override fun onSuccess(id: Int) {
          // do nothing
        }

        override fun onFailure(e: Exception) {
          EXL.e(ScheduledNotificationReceiver::class.java.name, e)
        }
      }
    )
  }

  init {
    NativeModuleDepsProvider.instance.inject(ScheduledNotificationReceiver::class.java, this)
  }
}
