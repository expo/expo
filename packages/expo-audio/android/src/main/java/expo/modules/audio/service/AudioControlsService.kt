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
import android.os.Build
import android.os.Bundle
import android.os.IBinder
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
import expo.modules.audio.getPlaybackServiceErrorMessage
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import java.net.URL

@OptIn(UnstableApi::class)
class AudioControlsService : MediaSessionService() {
  private val binder = AudioPlaybackServiceBinder(this)
  private var mediaSession: MediaSession? = null
  private var currentMetadata: Metadata? = null
  private var currentPlayer: AudioPlayer? = null
  private var currentOptions: AudioLockScreenOptions? = null
  private val scope = CoroutineScope(Dispatchers.IO)
  private var currentArtworkUrl: URL? = null
  private var currentArtwork: Bitmap? = null
  private var artworkLoadJob: Job? = null
  private val notificationId: Int
    get() = currentPlayer?.hashCode() ?: CHANNEL_ID.hashCode()

  private lateinit var weakContext: WeakReference<AppContext>
  var appContext: AppContext
    get() = weakContext.get() ?: throw Exceptions.AppContextLost()
    set(value) {
      weakContext = WeakReference(value)
    }

  var playbackListener: Player.Listener? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val currentPlayerRef = currentPlayer?.ref ?: return super.onStartCommand(intent, flags, startId)
    appContext.mainQueue.launch {
      when (intent?.action) {
        ACTION_PLAY -> currentPlayerRef.play()
        ACTION_PAUSE -> currentPlayerRef.pause()
        ACTION_TOGGLE ->
          if (currentPlayerRef.isPlaying) {
            currentPlayerRef.pause()
          } else {
            currentPlayerRef.play()
          }

        ACTION_SEEK_FORWARD -> currentPlayerRef.seekTo(currentPlayerRef.currentPosition + SEEK_INTERVAL_MS)
        ACTION_SEEK_BACKWARD -> currentPlayerRef.seekTo(currentPlayerRef.currentPosition - SEEK_INTERVAL_MS)
      }
    }

    postOrStartForegroundNotification(startInForeground = false)
    return super.onStartCommand(intent, flags, startId)
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannelIfNeeded()
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
      // If the title is null or empty string android sets the notification to "<AppName> is running..." we want to keep the notification empty so we \u200E to keep the text empty.
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
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          startForeground(
            notificationId,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
          )
        } else {
          startForeground(notificationId, notification)
        }
      } catch (e: Exception) {
        appContext.jsLogger?.error(
          getPlaybackServiceErrorMessage("Failed to start the expo-audio foreground service for lock screen controls"),
          e
        )
      }
    } else {
      notificationManager.notify(notificationId, notification)
    }
  }

  override fun onUpdateNotification(session: MediaSession, startInForegroundRequired: Boolean) {
    postOrStartForegroundNotification(startInForegroundRequired)
  }

  private fun setActivePlayerInternal(
    player: AudioPlayer?,
    metadata: Metadata? = null,
    options: AudioLockScreenOptions? = null
  ) {
    appContext.mainQueue.launch {
      val playbackListener = playbackListener ?: return@launch
      currentPlayer?.ref?.removeListener(playbackListener)
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

      appContext.mainQueue.launch {
        val context = appContext.reactContext ?: return@launch
        val session = MediaSession.Builder(context, player.ref)
          .setCallback(AudioMediaSessionCallback())
          .build()

        // Replace the basic media session with a session connected to our playback service.
        player.mediaSession.release()
        player.mediaSession = session

        addSession(session)
        mediaSession = session

        updateSessionCustomLayout(player.ref.isPlaying)

        postOrStartForegroundNotification(startInForeground = true)

        addPlayerListener(player)

        // Initial update now that session exists
        postOrStartForegroundNotification(startInForeground = false)
      }
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
    removePlayerListener()
    currentPlayer = null
    currentMetadata = null
    mediaSession?.release()
    mediaSession = null
    currentPlayer?.assignBasicMediaSession()
    stopForeground(STOP_FOREGROUND_REMOVE)
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
    return mediaSession
  }

  override fun onBind(intent: Intent?): IBinder {
    super.onBind(intent)
    return binder
  }

  fun registerPlayer(player: AudioPlayer) {
    setActivePlayerInternal(player, null, null)
  }

  fun setPlayerMetadata(player: AudioPlayer, metadata: Metadata?) {
    updateMetadataInternal(player, metadata)
  }

  fun setPlayerOptions(
    player: AudioPlayer,
    metadata: Metadata?,
    options: AudioLockScreenOptions?
  ) {
    if (player == currentPlayer) {
      currentMetadata = metadata
      currentOptions = options

      // Reload artwork if metadata has changed
      metadata?.artworkUrl?.let {
        loadArtworkFromUrl(it) { bitmap ->
          currentArtwork = bitmap
          postOrStartForegroundNotification(startInForeground = false)
        }
      }

      updateSessionCustomLayout(player.ref.isPlaying)
      postOrStartForegroundNotification(startInForeground = false)
    } else {
      setActivePlayerInternal(player, metadata, options)
    }
  }

  fun unregisterPlayer() {
    clearSessionInternal()
  }

  private fun loadArtworkFromUrl(url: URL, callback: (Bitmap?) -> Unit) {
    if (url != currentArtworkUrl) {
      currentArtworkUrl = url
      artworkLoadJob?.cancel()

      artworkLoadJob = scope.launch {
        try {
          val inputStream = url.openConnection().getInputStream()
          val bitmap = BitmapFactory.decodeStream(inputStream)

          if (isActive) {
            callback(bitmap)
          }
        } catch (e: Exception) {
          if (isActive) {
            callback(null)
          }
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

    artworkLoadJob?.cancel()
    artworkLoadJob = null
    scope.cancel()
    mediaSession?.release()
    mediaSession = null
    currentPlayer = null
    currentMetadata = null
    currentOptions = null
    currentArtwork = null
    currentArtworkUrl = null
    removePlayerListener()
  }

  private fun addPlayerListener(player: AudioPlayer) {
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
  }

  private fun removePlayerListener() {
    appContext.mainQueue.launch {
      val listener = playbackListener ?: return@launch
      currentPlayer?.ref?.removeListener(listener)
      playbackListener = null
    }
  }

  companion object {
    private const val CHANNEL_ID = "expo_audio_channel"
    private const val ACTION_PLAY = "expo.modules.audio.action.PLAY"
    private const val ACTION_PAUSE = "expo.modules.audio.action.PAUSE"
    private const val ACTION_TOGGLE = "expo.modules.audio.action.TOGGLE"

    const val ACTION_SEEK_FORWARD = "expo.modules.audio.action.SEEK_FORWARD"
    const val ACTION_SEEK_BACKWARD = "expo.modules.audio.action.SEEK_BACKWARD"

    const val SEEK_INTERVAL_MS = 10000L
  }
}
