package host.exp.exponent.notifications

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.RemoteInput
import com.raizlabs.android.dbflow.sql.language.SQLite
import com.raizlabs.android.dbflow.sql.language.Select
import host.exp.exponent.kernel.KernelConstants
import java.util.*

object NotificationActionCenter {
  const val KEY_TEXT_REPLY = "notification_remote_input"

  @Synchronized
  @JvmStatic fun putCategory(categoryId: String?, actions: List<MutableMap<String?, Any?>>) {
    throwExceptionIfOnMainThread()

    for (i in actions.indices) {
      val action = actions[i].apply {
        this["categoryId"] = categoryId
      }
      ActionObject(action, i).save()
    }
  }

  @Synchronized
  @JvmStatic fun removeCategory(categoryId: String?) {
    val actions = SQLite.select().from(ActionObject::class.java)
      .where(ActionObject_Table.categoryId.eq(categoryId))
      .queryList()

    for (actionObject in actions) {
      actionObject.delete()
    }
  }

  @Synchronized
  fun setCategory(
    categoryId: String,
    builder: NotificationCompat.Builder,
    context: Context,
    intentProvider: IntentProvider
  ) {
    throwExceptionIfOnMainThread()

    // Expo Go has a permanent notification, so we have to set max priority in order to show up buttons
    builder.priority = Notification.PRIORITY_MAX

    val actions = Select().from(ActionObject::class.java)
      .where(ActionObject_Table.categoryId.eq(categoryId))
      .orderBy(ActionObject_Table.position, true)
      .queryList()

    for (actionObject in actions) {
      addAction(builder, actionObject, intentProvider, context)
    }
  }

  private fun addAction(
    builder: NotificationCompat.Builder,
    actionObject: ActionObject,
    intentProvider: IntentProvider,
    context: Context
  ) {
    val intent = intentProvider.provide().apply {
      putExtra(KernelConstants.NOTIFICATION_ACTION_TYPE_KEY, actionObject.actionId)
    }
    // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
    val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
    val pendingIntent = PendingIntent.getActivity(
      context,
      UUID.randomUUID().hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag
    )
    val actionBuilder = NotificationCompat.Action.Builder(
      0,
      actionObject.buttonTitle,
      pendingIntent
    )

    if (actionObject.isShouldShowTextInput) {
      actionBuilder.addRemoteInput(
        RemoteInput.Builder(KEY_TEXT_REPLY)
          .setLabel(actionObject.placeholder)
          .build()
      )
    }

    builder.addAction(actionBuilder.build())
  }

  private fun throwExceptionIfOnMainThread() {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      throw RuntimeException("Do not use NotificationActionCenter class on the main thread!")
    }
  }
}
