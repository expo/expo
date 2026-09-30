package expo.modules.location.next

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE
import androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import androidx.core.content.edit
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.CompletableDeferred

class LocationForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? {
    return null
  }

  override fun onDestroy() = synchronized(serviceLock) {
    super.onDestroy()
    completePromotion(SessionState.Idle, ServicePromotionResult.Failed(ServiceDestroyedDuringPromotionException()))
    stopOnTaskRemovedOption = false
  }

  override fun onTaskRemoved(rootIntent: Intent?) = synchronized(serviceLock) {
    super.onTaskRemoved(rootIntent)
    if (stopOnTaskRemovedOption) {
      stopSelf()
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = synchronized(serviceLock) {
    val options = BackgroundSessionOptions.readPersisted(this)
    if (options == null) {
      stopSelf()
      completePromotion(SessionState.Stopping, ServicePromotionResult.Failed(BackgroundSessionStoppedDuringPromotionException()))
      return START_NOT_STICKY
    }

    try {
      val notification = buildNotification(this, options)
      ServiceCompat.startForeground(this, LOCATION_NOTIFICATION_ID, notification, FOREGROUND_SERVICE_TYPE_LOCATION)
      completePromotion(SessionState.Promoted, ServicePromotionResult.Promoted)
      stopOnTaskRemovedOption = options.stopOnTaskRemoved
    } catch (t: Throwable) {
      stopSelf()
      completePromotion(SessionState.Stopping, ServicePromotionResult.Failed(t))
    }

    return START_NOT_STICKY
  }

  companion object {
    // Service callbacks (e.g. onStartCommand) can happen on different thread than other methods as they are invoked by the system on the main thread
    // and not the JS thread / AsyncFunctionQueue handler thread like the DSL methods. Use lock on operations that access the global state to disallow any races.
    private val serviceLock = Any()
    private const val LOCATION_NOTIFICATION_ID = 1492
    private const val META_DATA_LOCATION_FOREGROUND_SERVICE_ICON = "expo.modules.location.foreground_service_icon"
    private const val NOTIFICATION_CHANNEL_ID = "expo.location.next.notification.channel"
    private var stopOnTaskRemovedOption: Boolean = false

    @Volatile
    var state: SessionState = SessionState.Idle
      private set

    private fun completePromotion(nextState: SessionState, result: ServicePromotionResult) {
      synchronized(serviceLock) {
        (state as? SessionState.Starting)?.promotion?.complete(result)
        state = nextState
      }
    }

    fun status(): BackgroundSessionStatus = synchronized(serviceLock) {
      val sessionState = when (state) {
        SessionState.Promoted -> BackgroundSessionState.PROMOTED
        is SessionState.Starting, SessionState.Stopping -> BackgroundSessionState.PENDING
        SessionState.Idle -> BackgroundSessionState.NOT_RUNNING
      }
      BackgroundSessionStatus(
        sessionState,
        stopOnTaskRemovedOption,
        isBackgroundLocationUnthrottled()
      )
    }

    @SuppressLint("MissingPermission")
    fun startOrUpdate(
      context: Context,
      options: BackgroundSessionOptions,
      updateOnly: Boolean = false
    ): SessionState {
      synchronized(serviceLock) {
        when (val current = state) {
          SessionState.Promoted -> {
            val notification = buildNotification(context, options)
            NotificationManagerCompat.from(context).notify(LOCATION_NOTIFICATION_ID, notification)
            stopOnTaskRemovedOption = options.stopOnTaskRemoved
            return current
          }
          is SessionState.Starting -> return current
          SessionState.Stopping -> throw BackgroundSessionStoppingException()
          SessionState.Idle -> {
            if (isBackgroundLocationUnthrottled()) {
              return current
            }
          }
        }
      }

      if (updateOnly) {
        throw BackgroundSessionRequiresForegroundException()
      }

      val starting = SessionState.Starting(CompletableDeferred()).also { state = it }
      val failCause = try {
        val serviceStartIntent = Intent(context, LocationForegroundService::class.java)
        if (context.startService(serviceStartIntent) != null) {
          return starting
        }
        ServiceNotFoundException()
      } catch (cause: Throwable) {
        cause
      }
      completePromotion(SessionState.Idle, ServicePromotionResult.Failed(failCause))
      throw failCause as? CodedException ?: ServicePromotionFailedException(failCause)
    }

    fun isBackgroundLocationUnthrottled(): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.O || state == SessionState.Promoted

    fun canPostNotifications(context: Context): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED

    fun resolveNotificationIcon(context: Context): Int {
      val packageName = context.packageName
      val metaData = try {
        context.packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA).metaData
      } catch (e: Exception) {
        null
      }
      return metaData?.getInt(META_DATA_LOCATION_FOREGROUND_SERVICE_ICON, 0)?.takeIf { it != 0 }
        ?: context.resources.getIdentifier("notification_icon", "drawable", packageName).takeIf { it != 0 }
        ?: context.applicationInfo.icon.takeIf { it != 0 }
        ?: throw NoNotificationIconException()
    }

    private fun ensureNotificationChannel(context: Context, appName: String): String {
      val channel = NotificationChannelCompat
        .Builder(NOTIFICATION_CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_LOW)
        .setName(appName)
        .setDescription("Location foreground service notification channel")
        .setShowBadge(false)
        .build()
      NotificationManagerCompat.from(context).createNotificationChannel(channel)
      return NOTIFICATION_CHANNEL_ID
    }

    fun buildNotification(context: Context, options: BackgroundSessionOptions): Notification {
      val packageManager = context.packageManager
      val packageName = context.packageName
      val appName = context.applicationInfo.loadLabel(packageManager).toString()

      val notificationBuilder = NotificationCompat
        .Builder(context, ensureNotificationChannel(context, appName))
        .setForegroundServiceBehavior(FOREGROUND_SERVICE_IMMEDIATE)
        .setSmallIcon(resolveNotificationIcon(context))
        .setVisibility(VISIBILITY_PUBLIC)
        .setContentTitle(options.notificationTitle ?: appName)
        .setOngoing(true)
        .setCategory(Notification.CATEGORY_SERVICE)
      options.notificationBody?.let { notificationBuilder.setContentText(it).setStyle(NotificationCompat.BigTextStyle().bigText(it)) }
      options.notificationColor?.let { notificationBuilder.setColorized(true).setColor(it) }

      packageManager.getLaunchIntentForPackage(packageName)?.let {
        it.flags = it.flags or Intent.FLAG_ACTIVITY_SINGLE_TOP
        val getActivityFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val contentIntent = PendingIntent.getActivity(context, 0, it, getActivityFlags)
        notificationBuilder.setContentIntent(contentIntent)
      }

      return notificationBuilder.build()
    }
  }
}

enum class BackgroundSessionState : Enumerable {
  NOT_RUNNING,
  PENDING,
  PROMOTED
}

sealed interface ServicePromotionResult {
  data object Promoted : ServicePromotionResult
  data class Failed(val cause: Throwable) : ServicePromotionResult
}

sealed interface SessionState {
  data object Idle : SessionState
  data class Starting(val promotion: CompletableDeferred<ServicePromotionResult>) : SessionState
  data object Promoted : SessionState
  data object Stopping : SessionState
}

@OptimizedRecord
class BackgroundSessionStatus(
  @Field val state: BackgroundSessionState,
  @Field val stopOnTaskRemoved: Boolean,
  @Field val unthrottled: Boolean
) : Record

@OptimizedRecord
class BackgroundSessionOptions(
  @Field val notificationTitle: String? = null,
  @Field val notificationBody: String? = null,
  @Field val notificationColor: Int? = null,
  @Field val stopOnTaskRemoved: Boolean = false
) : Record {
  companion object {
    private const val PREFERENCES_NAME = "expo.modules.location.next.backgroundSession"
    private const val KEY_REQUESTED = "requested"
    private const val KEY_TITLE = "notificationTitle"
    private const val KEY_BODY = "notificationBody"
    private const val KEY_COLOR = "notificationColor"
    private const val KEY_STOP_ON_TASK_REMOVED = "stopOnTaskRemoved"

    private fun preferences(context: Context) =
      context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    fun persist(context: Context, options: BackgroundSessionOptions) {
      preferences(context).edit {
        putBoolean(KEY_REQUESTED, true)
        putString(KEY_TITLE, options.notificationTitle)
        putString(KEY_BODY, options.notificationBody)
        if (options.notificationColor != null) {
          putInt(KEY_COLOR, options.notificationColor)
        } else {
          remove(KEY_COLOR)
        }
        putBoolean(KEY_STOP_ON_TASK_REMOVED, options.stopOnTaskRemoved)
      }
    }

    fun clearPersisted(context: Context) {
      preferences(context).edit { clear() }
    }

    fun readPersisted(context: Context): BackgroundSessionOptions? {
      val preferences = preferences(context)
      if (!preferences.getBoolean(KEY_REQUESTED, false)) {
        return null
      }
      return BackgroundSessionOptions(
        notificationTitle = preferences.getString(KEY_TITLE, null),
        notificationBody = preferences.getString(KEY_BODY, null),
        notificationColor = if (preferences.contains(KEY_COLOR)) preferences.getInt(KEY_COLOR, 0) else null,
        stopOnTaskRemoved = preferences.getBoolean(KEY_STOP_ON_TASK_REMOVED, false)
      )
    }
  }
}

class BackgroundSessionRequiresForegroundException : CodedException("Cannot start the background session, because the app is in the background. Android 12 and above only allows a foreground service to start while the app is in the foreground. Call `ensureStarted` while the app is in the foreground - a request made from the background is recorded and honoured the next time the app returns to the foreground.")
class ServicePromotionFailedException(cause: Throwable) : CodedException(cause.localizedMessage, cause)
class ServicePromotionTimedOutException : CodedException("The foreground service did not confirm that it was promoted in time, so the state of the background session is unknown. It may still promote shortly. Read `BackgroundSession.status()` to find out whether it did.")
class NoNotificationIconException : CodedException("No notification icon was configured.")
class MissingNotificationPermissionException : CodedException("Cannot start the background session, because the `android.permission.POST_NOTIFICATIONS` permission is not granted. The location foreground service is promoted with a notification, and Android 13 and above requires that permission to post one. Call `requestNotificationPermissionsAsync` before `ensureStarted`.")
class ServiceNotFoundException : CodedException("The location foreground service could not be started, because the system found no service to start. `expo.modules.location.next.LocationForegroundService` is declared in expo-location's own manifest, so this almost always means the app's manifest merge dropped it. Check for a `tools:node=\"remove\"` or `tools:replace` rule on that service and re-run `npx expo prebuild --clean`.")
class ServiceDestroyedDuringPromotionException : CodedException("The foreground service was destroyed before it finished promoting, so the background session did not start. The service was most likely stopped while starting up. Call `ensureStarted` again while the app is in the foreground.")
class BackgroundSessionStoppingException : CodedException("Cannot start the background session, because the previous one is still stopping. The foreground service is being torn down and a new one cannot start until it is gone. Call `ensureStarted` again in a moment.")
class BackgroundSessionStoppedDuringPromotionException : CodedException("The background session was stopped while the foreground service was starting, so the service did not start. Call `ensureStarted` again if you still want a background session.")
