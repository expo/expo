package expo.modules.audio.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.MediaStyleNotificationHelper
import expo.modules.audio.AudioPlayer
import expo.modules.audio.Metadata
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.net.URL

@OptIn(UnstableApi::class)
class AudioControlsService : MediaSessionService() {
  private val binder = AudioControlsBinder()
  private var mediaSession: MediaSession? = null
  private var currentMetadata: Metadata? = null
  private var currentPlayer: AudioPlayer? = null
  private val scope = CoroutineScope(Dispatchers.IO)
  private var currentArtworkUrl: URL? = null
  private var currentArtwork: Bitmap? = null

  inner class AudioControlsBinder : Binder() {
    fun getService(): AudioControlsService = this@AudioControlsService
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    createNotificationChannel()
    return super.onStartCommand(intent, flags, startId)
  }

  override fun onCreate() {
    super.onCreate()
    instance = this

    pendingPlayer?.let { player ->
      setActivePlayerInternal(player, pendingMetadata)
      pendingPlayer = null
      pendingMetadata = null
    }
  }

  private fun createNotificationChannel() {
    mediaSession?.let {
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        notificationManager.createNotificationChannel(NotificationChannel(CHANNEL_ID, CHANNEL_ID, NotificationManager.IMPORTANCE_LOW))
      }

      // Intent to open the app when the notification is tapped
      val appIntent = packageManager.getLaunchIntentForPackage(packageName)
      val contentIntent = PendingIntent.getActivity(
        this,
        0,
        appIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      val notificationCompat = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
        .setContentTitle(currentMetadata?.title ?: "\u200E")
        .setContentText(currentMetadata?.artist)
        .setContentInfo(currentMetadata?.albumTitle)
        .setLargeIcon(currentArtwork)
        .setContentIntent(contentIntent)
        .setAutoCancel(false)
        .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
        .setStyle(MediaStyleNotificationHelper.MediaStyle(it))
        .build()

      notificationManager.notify(currentPlayer.hashCode(), notificationCompat)
    }
  }

  override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
    createNotificationChannel()
  }

  private fun setActivePlayerInternal(player: AudioPlayer?, metadata: Metadata? = null) {
    currentPlayer?.isActiveForLockScreen = false
    hideNotification()

    currentPlayer = player
    currentMetadata = metadata

    metadata?.artworkUrl?.let {
      loadArtworkFromUrl(it) { bitmap ->
        currentArtwork = bitmap
        createNotificationChannel()
      }
    }
    player?.isActiveForLockScreen = true

    if (player != null) {
      mediaSession?.release()
      mediaSession = MediaSession.Builder(this, player.ref)
        .setCallback(AudioMediaSessionCallback())
        .build()
      createNotificationChannel()
    } else {
      clearSessionInternal()
    }
  }

  private fun updateMetadataInternal(player: AudioPlayer, metadata: Metadata?) {
    if (player != currentPlayer || metadata == currentMetadata) {
      return
    }
    currentMetadata = metadata
    currentMetadata?.artworkUrl?.let {
      loadArtworkFromUrl(it) { bitmap ->
        currentArtwork = bitmap
        createNotificationChannel()
      }
    } ?: createNotificationChannel()
  }

  private fun clearSessionInternal() {
    currentPlayer?.isActiveForLockScreen = false
    currentPlayer = null
    currentMetadata = null
    mediaSession?.release()
    mediaSession = null
    stopForeground(true)
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
    return mediaSession
  }

  override fun onBind(intent: Intent?): IBinder {
    return super.onBind(intent) ?: binder
  }

  private fun loadArtworkFromUrl(url: URL, callback: (Bitmap?) -> Unit) {
    if (url != currentArtworkUrl) {
      currentArtworkUrl = url
      scope.launch {
        try {
          val inputStream = url.openConnection().getInputStream()
          val bitmap = BitmapFactory.decodeStream(inputStream)
          callback(bitmap)
        } catch (e: Exception) {
          callback(null)
        }
      }
    }
  }

  private fun hideNotification() {
    val notificationManager: NotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(currentPlayer.hashCode())
  }

  override fun onDestroy() {
    super.onDestroy()
    instance = null
    try {
      scope.cancel()
    } catch (e: Exception) {
      //
    }
    mediaSession?.release()
    currentPlayer = null
  }

  companion object {
    private const val CHANNEL_ID = "expo_audio_channel"
    private var pendingPlayer: AudioPlayer? = null
    private var pendingMetadata: Metadata? = null

    @Volatile
    private var instance: AudioControlsService? = null

    fun getInstance(): AudioControlsService? = instance

    fun setActivePlayer(context: Context, player: AudioPlayer?, metadata: Metadata? = null) {
      val service = getInstance()
      if (service != null) {
        service.setActivePlayerInternal(player, metadata)
      } else {
        val intent = Intent(context, AudioControlsService::class.java)
        context.startService(intent)

        pendingPlayer = player
        pendingMetadata = metadata
      }
    }

    fun updateMetadata(player: AudioPlayer, metadata: Metadata?) {
      getInstance()?.updateMetadataInternal(player, metadata)
    }

    fun clearSession() {
      getInstance()?.clearSessionInternal()
    }
  }
}
