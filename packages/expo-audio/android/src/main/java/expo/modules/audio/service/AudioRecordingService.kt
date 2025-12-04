package expo.modules.audio.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import expo.modules.audio.AudioRecorder
import java.lang.ref.WeakReference

private const val TAG = "AudioRecordingService"

class AudioRecordingService : Service() {
  private val binder = AudioRecordingBinder()
  private var activeRecorders = mutableSetOf<WeakReference<AudioRecorder>>()
  private var notificationId = NOTIFICATION_ID

  inner class AudioRecordingBinder : Binder() {
    fun getService(): AudioRecordingService = this@AudioRecordingService
  }

  override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "Service onCreate()")
    instance = this
    createNotificationChannelIfNeeded()

    synchronized(pendingRecorders) {
      pendingRecorders.forEach { recorder ->
        registerRecorder(recorder)
      }
      pendingRecorders.clear()
    }
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
    } catch (_: Exception) {
    }
  }

  fun registerRecorder(recorder: AudioRecorder) {
    activeRecorders.removeAll { it.get() == null }
    activeRecorders.add(WeakReference(recorder))

    if (activeRecorders.size == 1) {
      startForegroundWithNotification()
    }
  }

  fun unregisterRecorder(recorder: AudioRecorder) {
    activeRecorders.removeAll { it.get() == recorder || it.get() == null }

    if (activeRecorders.isEmpty()) {
      stopSelf()
    }
  }

  private fun stopRecordingAndService() {
    activeRecorders.forEach { weakRef ->
      weakRef.get()?.stopRecording()
    }
    activeRecorders.clear()
    stopSelf()
  }

  override fun onBind(intent: Intent?): IBinder {
    return binder
  }

  override fun onDestroy() {
    super.onDestroy()
    instance = null
    activeRecorders.clear()
  }

  companion object {
    private const val CHANNEL_ID = "expo_audio_recording_channel"
    private const val NOTIFICATION_ID = 2001
    private const val ACTION_START_RECORDING = "expo.modules.audio.action.START_RECORDING"
    private const val ACTION_STOP_RECORDING = "expo.modules.audio.action.STOP_RECORDING"

    @Volatile
    private var instance: AudioRecordingService? = null
    private val pendingRecorders = mutableSetOf<AudioRecorder>()

    fun getInstance(): AudioRecordingService? = instance

    fun startService(context: Context, recorder: AudioRecorder) {
      val intent = Intent(context, AudioRecordingService::class.java).apply {
        action = ACTION_START_RECORDING
      }

      val service = getInstance()
      if (service != null) {
        service.registerRecorder(recorder)
      } else {
        synchronized(pendingRecorders) {
          pendingRecorders.add(recorder)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }
      }
    }

    fun stopService(context: Context) {
      val intent = Intent(context, AudioRecordingService::class.java).apply {
        action = ACTION_STOP_RECORDING
      }
      context.startService(intent)
    }
  }
}
