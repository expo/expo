package expo.modules.location.next.locationForegroundService

import android.annotation.SuppressLint
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
import android.os.Build
import android.os.IBinder
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import expo.modules.kotlin.exception.CodedException
import kotlinx.coroutines.CompletableDeferred

private const val LOCATION_NOTIFICATION_ID = 1492

class LocationForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

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
    private var stopOnTaskRemovedOption: Boolean = false

    @Volatile
    var state: SessionState = SessionState.Idle
      private set

    private fun completePromotion(nextState: SessionState, result: ServicePromotionResult) {
      synchronized(serviceLock) {
        val currentState = state
        if (currentState is SessionState.Starting) {
          currentState.promotion.complete(result)
        }
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
      val starting = synchronized(serviceLock) {
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
            if (updateOnly) {
              throw BackgroundSessionRequiresForegroundException()
            }
            SessionState.Starting(CompletableDeferred()).also { state = it }
          }
        }
      }

      return runCatching {
        val serviceStartIntent = Intent(context, LocationForegroundService::class.java)
        if (context.startService(serviceStartIntent) == null) {
          throw ServiceNotFoundException()
        }
        starting
      }.getOrElse {
        completePromotion(SessionState.Idle, ServicePromotionResult.Failed(it))
        throw it as? CodedException ?: ServicePromotionFailedException(it)
      }
    }

    fun stop(context: Context) {
      synchronized(serviceLock) {
        if (state == SessionState.Promoted) {
          state = SessionState.Stopping
        }
        BackgroundSessionOptions.clearPersisted(context)
      }
      context.stopService(Intent(context, LocationForegroundService::class.java))
    }

    @get:ChecksSdkIntAtLeast(api = Build.VERSION_CODES.O)
    val isForegroundServiceRequired: Boolean
      get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O

    fun isBackgroundLocationUnthrottled(): Boolean =
      !isForegroundServiceRequired || state == SessionState.Promoted
  }
}
