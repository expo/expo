package expo.modules.audio.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import expo.modules.audio.AudioRecorder
import expo.modules.audio.getRecordingServiceErrorMessage
import expo.modules.kotlin.AppContext
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
    createNotificationChannelIfNeeded()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START_RECORDING -> {
        if (activeRecorders.isNotEmpty()) {
          startForegroundWithNotification()
        }
      }
      ACTION_STOP_RECORDING -> {
        stopRecordingAndService()
      }
    }
    return START_NOT_STICKY
  }

  private fun createNotificationChannelIfNeeded() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (notificationManager.getNotificationChannel(CHANNEL_ID) == null) {
        val channel = NotificationChannel(
          CHANNEL_ID,
          "Audio Recording",
          NotificationManager.IMPORTANCE_LOW
        ).apply {
          description = "Shows when audio is being recorded in the background"
          setShowBadge(false)
          enableVibration(false)
          enableLights(false)
          setSound(null, null)
        }
        notificationManager.createNotificationChannel(channel)
      }
    }
  }

  private fun buildNotification(): Notification {
    val stopIntent = Intent(this, AudioRecordingService::class.java).apply {
      action = ACTION_STOP_RECORDING
    }
    val stopPendingIntent = PendingIntent.getService(
      this,
      0,
      stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val contentIntent = packageManager.getLaunchIntentForPackage(packageName)?.let { appIntent ->
      PendingIntent.getActivity(
        this,
        0,
        appIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Recording audio")
      .setContentText("Tap to return to app")
      .setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setOngoing(true)
      .setContentIntent(contentIntent)
      .addAction(
        android.R.drawable.ic_delete,
        "Stop",
        stopPendingIntent
      )
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setSilent(true)
      .setShowWhen(false)
      .setVisibility(NotificationCompat.VISIBILITY_SECRET) // Hide from lock screen on secure devices
      .build()
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
      }
    }
  }

  private fun stopRecordingAndService() {
    synchronized(recorderLock) {
      activeRecorders.forEach { weakRef ->
        weakRef.get()?.stopRecording()
      }
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
    internal const val ACTION_STOP_RECORDING = "expo.modules.audio.action.STOP_RECORDING"
  }
}
