package expo.modules.audio.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import expo.modules.audio.AudioRecorder
import expo.modules.audio.RecordingNotificationOptions
import expo.modules.audio.getRecordingServiceErrorMessage
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.ColorCompat
import java.lang.ref.WeakReference

private const val TAG = "AudioRecordingService"

class AudioRecordingService : Service() {
  private val binder = AudioRecordingServiceBinder(this)
  private val activeRecorders = mutableSetOf<WeakReference<AudioRecorder>>()
  private val recorderLock = Any()
  private var notificationId = NOTIFICATION_ID

  @Volatile
  private var isRunningForeground = false

  private var weakContext: WeakReference<AppContext>? = null
  var appContext: AppContext?
    get() = weakContext?.get()
    set(value) {
      weakContext = value?.let { WeakReference(it) }
    }

  override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "Service onCreate()")
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START_RECORDING -> {
        if (activeRecorders.isNotEmpty()) {
          startForegroundWithNotification()
        }
      }
      ACTION_NOTIFICATION -> {
        handleNotificationAction(intent)
        if (notificationRecorder() == null) {
          stopSelf()
        }
      }
    }
    return START_NOT_STICKY
  }

  private fun createNotificationChannelIfNeeded(options: RecordingNotificationOptions) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      // Recreating a channel updates its name without overriding the user's settings.
      val channel = NotificationChannel(
        CHANNEL_ID,
        options.channelName,
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = options.channelDescription
        setShowBadge(false)
        enableVibration(false)
        enableLights(false)
        setSound(null, null)
      }
      notificationManager.createNotificationChannel(channel)
    }
  }

  private fun notificationRecorder(): AudioRecorder? = synchronized(recorderLock) {
    activeRecorders.firstNotNullOfOrNull { it.get() }
  }

  private fun actionPendingIntent(actionId: String, recorder: AudioRecorder): PendingIntent {
    val intent = Intent(this, AudioRecordingService::class.java).apply {
      action = ACTION_NOTIFICATION
      // Extras do not participate in PendingIntent identity. A URI isolates each prepared session.
      data = Uri.Builder().scheme("expo-audio").authority("recording")
        .appendPath(recorder.id)
        .appendPath(recorder.notificationSessionId)
        .appendPath(actionId)
        .build()
      putExtra(EXTRA_RECORDER_ID, recorder.id)
      putExtra(EXTRA_SESSION_ID, recorder.notificationSessionId)
      putExtra(EXTRA_ACTION_ID, actionId)
    }
    return PendingIntent.getService(
      this,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun handleNotificationAction(intent: Intent) {
    synchronized(recorderLock) {
      val sessionId = intent.getStringExtra(EXTRA_SESSION_ID) ?: return
      val recorder = activeRecorders.mapNotNull { it.get() }.firstOrNull {
        it.id == intent.getStringExtra(EXTRA_RECORDER_ID) &&
          it.notificationSessionId == sessionId && it.isPrepared
      } ?: return
      val actionId = intent.getStringExtra(EXTRA_ACTION_ID) ?: return
      recorder.handleNotificationAction(actionId, sessionId) {
        // The default Stop button stops every recorder using this service.
        stopRecordingAndService()
      }
    }
  }

  private fun buildNotification(): Notification {
    val recorder = notificationRecorder()
    val options = recorder?.notificationOptions ?: RecordingNotificationOptions()
    val paused = recorder?.isPaused == true
    createNotificationChannelIfNeeded(options)
    val icon = getRecordingNotificationIcon(this, options.smallIcon)
    val contentIntent = packageManager.getLaunchIntentForPackage(packageName)?.let { appIntent ->
      PendingIntent.getActivity(
        this,
        0,
        appIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(options.title)
      .setContentText(
        if (paused) {
          options.pausedBody ?: options.recordingBody
        } else {
          options.recordingBody
        }
      )
      .setSmallIcon(icon)
      .setOngoing(true)
      .setContentIntent(contentIntent)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setSilent(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(false)
      .setVisibility(
        if (options.showOnLockScreen) {
          NotificationCompat.VISIBILITY_PRIVATE
        } else {
          NotificationCompat.VISIBILITY_SECRET
        }
      )
    options.color?.let { builder.setColor(ColorCompat.toArgb(it)) }
    if (recorder != null) {
      options.resolvedButtons(paused).forEach { button ->
        val icon = when (button.id) {
          "pause" -> android.R.drawable.ic_media_pause
          "resume" -> android.R.drawable.ic_media_play
          "stop" -> android.R.drawable.ic_delete
          else -> 0
        }
        builder.addAction(icon, button.title, actionPendingIntent(button.id, recorder))
      }
    }
    return builder.build()
  }

  fun updateNotification() {
    if (isRunningForeground && notificationRecorder() != null) {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.notify(notificationId, buildNotification())
    }
  }

  private fun startForegroundWithNotification() {
    val notification = buildNotification()

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        startForeground(
          notificationId,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        )
      } else {
        startForeground(notificationId, notification)
      }
      isRunningForeground = true
    } catch (e: Exception) {
      appContext?.jsLogger?.error(
        getRecordingServiceErrorMessage("Failed to start the expo-audio foreground service for background recording"),
        e
      )
      isRunningForeground = false
    }
  }

  private fun stopForegroundWithNotification() {
    stopForeground(STOP_FOREGROUND_REMOVE)
    isRunningForeground = false
  }

  fun registerRecorder(recorder: AudioRecorder) {
    synchronized(recorderLock) {
      activeRecorders.removeAll { it.get() == null }

      if (activeRecorders.any { it.get() === recorder }) {
        return
      }

      activeRecorders.add(WeakReference(recorder))

      if (activeRecorders.size == 1 || !isRunningForeground) {
        startForegroundWithNotification()
      }
    }
  }

  fun unregisterRecorder(recorder: AudioRecorder) {
    synchronized(recorderLock) {
      activeRecorders.removeAll { it.get() == recorder || it.get() == null }

      if (activeRecorders.isEmpty()) {
        stopForegroundWithNotification()
        stopSelf()
      } else {
        updateNotification()
      }
    }
  }

  private fun stopRecordingAndService() {
    synchronized(recorderLock) {
      // Stopping a recorder unregisters it, so iterate over a snapshot.
      activeRecorders.mapNotNull { it.get() }.forEach { it.stopRecording() }
      activeRecorders.clear()
    }

    stopForegroundWithNotification()
    stopSelf()
  }

  override fun onBind(intent: Intent?): IBinder {
    return binder
  }

  override fun onDestroy() {
    super.onDestroy()
    // Ensure notification is removed when service is destroyed
    stopForegroundWithNotification()
    synchronized(recorderLock) {
      activeRecorders.clear()
    }
  }

  companion object {
    private const val CHANNEL_ID = "expo_audio_recording_channel"
    private const val NOTIFICATION_ID = 2001
    internal const val ACTION_START_RECORDING = "expo.modules.audio.action.START_RECORDING"
    private const val ACTION_NOTIFICATION = "expo.modules.audio.action.RECORDING_NOTIFICATION"
    private const val EXTRA_RECORDER_ID = "recorderId"
    private const val EXTRA_SESSION_ID = "sessionId"
    private const val EXTRA_ACTION_ID = "actionId"
  }
}

@SuppressLint("DiscouragedApi") // The app supplies its own drawable resource name.
internal fun getRecordingNotificationIcon(context: Context, smallIcon: String?): Int {
  if (smallIcon != null) {
    val icon = context.resources.getIdentifier(smallIcon, "drawable", context.packageName)
    if (icon != 0) {
      return icon
    }
    Log.w(TAG, "Recording notification icon '$smallIcon' was not found. Include the drawable in the native build and keep it when shrinking resources. Using a fallback icon.")
  }
  val metadataIcon = try {
    context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
      .metaData?.getInt("expo.modules.audio.foreground_service_icon", 0) ?: 0
  } catch (e: PackageManager.NameNotFoundException) {
    0
  }
  return metadataIcon.takeIf { it != 0 }
    ?: context.resources.getIdentifier("notification_icon", "drawable", context.packageName).takeIf { it != 0 }
    ?: android.R.drawable.ic_btn_speak_now
}
