package expo.modules.audio.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.CommandButton
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.MediaStyleNotificationHelper
import androidx.media3.session.SessionCommand
import expo.modules.audio.AudioLockScreenOptions
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
  private var currentOptions: AudioLockScreenOptions? = null
  private val scope = CoroutineScope(Dispatchers.IO)
  private var currentArtworkUrl: URL? = null
  private var currentArtwork: Bitmap? = null
  private val notificationId: Int
    get() = currentPlayer?.hashCode() ?: CHANNEL_ID.hashCode()

  private var playbackListener: Player.Listener? = null

  inner class AudioControlsBinder : Binder() {
    fun getService(): AudioControlsService = this@AudioControlsService
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Handle media button actions dispatched from notification
    when (intent?.action) {
      ACTION_PLAY -> withPlayerOnAppThread { it.play() }
      ACTION_PAUSE -> withPlayerOnAppThread { it.pause() }
      ACTION_TOGGLE -> withPlayerOnAppThread { player ->
        if (player.isPlaying) player.pause() else player.play()
      }

      ACTION_SEEK_FORWARD -> withPlayerOnAppThread { player ->
        player.seekTo(player.currentPosition + SEEK_INTERVAL_MS)
      }

      ACTION_SEEK_BACKWARD -> withPlayerOnAppThread { player ->
        player.seekTo(player.currentPosition - SEEK_INTERVAL_MS)
      }
    }

    // Ensure channel exists and update current notification
    postOrStartForegroundNotification(startInForeground = false)
    return super.onStartCommand(intent, flags, startId)
  }

  override fun onCreate() {
    super.onCreate()
    instance = this
    createNotificationChannelIfNeeded()

    pendingPlayer?.let { player ->
      setActivePlayerInternal(player, pendingMetadata, pendingOptions)
      pendingPlayer = null
      pendingMetadata = null
    }
  }

  private fun createNotificationChannelIfNeeded() {
    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (notificationManager.getNotificationChannel(CHANNEL_ID) == null) {
        notificationManager.createNotificationChannel(
          NotificationChannel(
            CHANNEL_ID,
            CHANNEL_ID,
            NotificationManager.IMPORTANCE_LOW
          )
        )
      }
    }
  }

  private fun buildContentIntent(): PendingIntent? {
    val appIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    return PendingIntent.getActivity(
      this,
      0,
      appIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun buildNotification(): Notification? {
    val session = mediaSession ?: return null

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(androidx.media3.session.R.drawable.media3_icon_circular_play)
      .setContentTitle(currentMetadata?.title ?: "\u200E")
      .setContentText(currentMetadata?.artist)
      .setSubText(currentMetadata?.albumTitle)
      .setLargeIcon(currentArtwork)
      .setContentIntent(buildContentIntent())
      .setAutoCancel(false)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)

    // Using only session custom layout: do NOT call setShowActionsInCompactView.
    // The compact layout will follow the order of the custom layout provided to the session.
    builder.setStyle(MediaStyleNotificationHelper.MediaStyle(session))

    return builder.build()
  }

  private fun updateSessionCustomLayout(isPlaying: Boolean) {
    val session = mediaSession ?: return
    val customLayout = mutableListOf<CommandButton>()

    // Add seek backward button if enabled
    if (currentOptions?.showSeekBackward == true) {
      customLayout.add(
        CommandButton.Builder(CommandButton.ICON_SKIP_BACK)
          .setDisplayName("Seek Backward")
          .setEnabled(true)
          .setSessionCommand(SessionCommand(ACTION_SEEK_BACKWARD, Bundle.EMPTY))
          .build()
      )
    }

    // Add play/pause button (always present)
    customLayout.add(
      CommandButton.Builder(if (isPlaying) CommandButton.ICON_PAUSE else CommandButton.ICON_PLAY)
        .setDisplayName(if (isPlaying) "Pause" else "Play")
        .setEnabled(true)
        .setPlayerCommand(Player.COMMAND_PLAY_PAUSE)
        .build()
    )

    // Add seek forward button if enabled
    if (currentOptions?.showSeekForward == true) {
      customLayout.add(
        CommandButton.Builder(CommandButton.ICON_SKIP_FORWARD)
          .setDisplayName("Seek Forward")
          .setEnabled(true)
          .setSessionCommand(SessionCommand(ACTION_SEEK_FORWARD, Bundle.EMPTY))
          .build()
      )
    }

    session.setCustomLayout(customLayout)
  }

  private fun postOrStartForegroundNotification(startInForeground: Boolean) {
    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val notification = buildNotification() ?: return

    if (startInForeground) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        startForeground(
          notificationId,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
        )
      } else {
        startForeground(notificationId, notification)
      }
    } else {
      notificationManager.notify(notificationId, notification)
    }
  }

  override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
    // Called by Media3 when the session's notification should be updated.
    postOrStartForegroundNotification(startInForegroundRequired)
  }

  private fun setActivePlayerInternal(
    player: AudioPlayer?,
    metadata: Metadata? = null,
    options: AudioLockScreenOptions? = null
  ) {
    // Detach listener from previous player, clear active flag and hide
    playbackListener?.let { listener ->
      currentPlayer?.ref?.removeListener(listener)
    }
    playbackListener = null
    currentPlayer?.isActiveForLockScreen = false
    hideNotification()

    currentPlayer = player
    currentMetadata = metadata
    currentOptions = options

    metadata?.artworkUrl?.let {
      loadArtworkFromUrl(it) { bitmap ->
        currentArtwork = bitmap
        postOrStartForegroundNotification(startInForeground = false)
      }
    }
    player?.isActiveForLockScreen = true

    if (player != null) {
      mediaSession?.release()

      val session = MediaSession.Builder(this, player.ref)
        .setCallback(AudioMediaSessionCallback())
        .build()

      addSession(session)
      mediaSession = session

      // Set initial custom layout
      updateSessionCustomLayout(player.ref.isPlaying)

      postOrStartForegroundNotification(startInForeground = true)

      // Listen for playback state changes to refresh notification and update custom layout
      val listener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
          updateSessionCustomLayout(isPlaying)
          postOrStartForegroundNotification(startInForeground = false)
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
          postOrStartForegroundNotification(startInForeground = false)
        }
      }
      playbackListener = listener
      player.ref.addListener(listener)
      // Initial update now that session exists
      postOrStartForegroundNotification(startInForeground = false)
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
        postOrStartForegroundNotification(startInForeground = false)
      }
    } ?: postOrStartForegroundNotification(startInForeground = false)
  }

  private fun clearSessionInternal() {
    currentPlayer?.isActiveForLockScreen = false
    playbackListener?.let { listener ->
      currentPlayer?.ref?.removeListener(listener)
    }
    playbackListener = null
    currentPlayer = null
    currentMetadata = null
    mediaSession?.release()
    mediaSession = null
    stopForeground(STOP_FOREGROUND_REMOVE)
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
    return mediaSession
  }

  private fun withPlayerOnAppThread(block: (Player) -> Unit) {
    val player = currentPlayer?.ref ?: return
    val looper: Looper = player.applicationLooper
    if (Looper.myLooper() == looper) {
      block(player)
    } else {
      Handler(looper).post { block(player) }
    }
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
    val notificationManager: NotificationManager =
      getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.cancel(notificationId)
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
    private const val ACTION_PLAY = "expo.modules.audio.action.PLAY"
    private const val ACTION_PAUSE = "expo.modules.audio.action.PAUSE"
    private const val ACTION_TOGGLE = "expo.modules.audio.action.TOGGLE"

    const val ACTION_SEEK_FORWARD = "expo.modules.audio.action.SEEK_FORWARD"
    const val ACTION_SEEK_BACKWARD = "expo.modules.audio.action.SEEK_REWIND"

    const val SEEK_INTERVAL_MS = 10000L

    private var pendingPlayer: AudioPlayer? = null
    private var pendingMetadata: Metadata? = null
    private var pendingOptions: AudioLockScreenOptions? = null

    @Volatile
    private var instance: AudioControlsService? = null

    fun getInstance(): AudioControlsService? = instance

    fun setActivePlayer(
      context: Context,
      player: AudioPlayer?,
      metadata: Metadata? = null,
      options: AudioLockScreenOptions? = null
    ) {
      val service = getInstance()
      if (service != null) {
        service.setActivePlayerInternal(player, metadata, options)
      } else {
        val intent = Intent(context, AudioControlsService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }

        pendingPlayer = player
        pendingMetadata = metadata
        pendingOptions = options
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
