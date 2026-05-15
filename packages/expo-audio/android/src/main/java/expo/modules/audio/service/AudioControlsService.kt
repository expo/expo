package expo.modules.audio.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.media3.common.ForwardingPlayer
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
  private lateinit var audioManager: AudioManager
  private val binder = AudioPlaybackServiceBinder(this)
  private var mediaSession: MediaSession? = null
  private var sessionMetadataPlayer: MetadataInjectingPlayer? = null
  private var currentMetadata: Metadata? = null
  private var currentPlayer: AudioPlayer? = null
  private var currentOptions: AudioLockScreenOptions? = null
  private val scope = CoroutineScope(Dispatchers.IO)
  private var currentArtworkUrl: URL? = null
  private var currentArtwork: Bitmap? = null
  private var artworkLoadJob: Job? = null
  private val notificationId: Int
    get() = currentPlayer?.hashCode() ?: CHANNEL_ID.hashCode()

  private var weakContext: WeakReference<AppContext>? = null
  var appContext: AppContext?
    get() = weakContext?.get()
    set(value) {
      weakContext = value?.let { WeakReference(it) }
    }

  var playsInSilentMode: Boolean = true
  var playbackListener: Player.Listener? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val currentPlayerRef = currentPlayer?.ref ?: return super.onStartCommand(intent, flags, startId)
    val context = appContext ?: return super.onStartCommand(intent, flags, startId)

    context.mainQueue.launch {
      when (intent?.action) {
        ACTION_PLAY -> {
          if (shouldPlayInSilentMode()) {
            currentPlayerRef.play()
          }
        }
        ACTION_PAUSE -> currentPlayerRef.pause()
        ACTION_TOGGLE ->
          if (currentPlayerRef.isPlaying) {
            currentPlayerRef.pause()
          } else if (shouldPlayInSilentMode()) {
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
    audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
    createNotificationChannelIfNeeded()
  }

  private fun shouldPlayInSilentMode(): Boolean {
    return playsInSilentMode || audioManager.ringerMode == AudioManager.RINGER_MODE_NORMAL
  }

  private fun createNotificationChannelIfNeeded() {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
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

  private fun buildActionPendingIntent(action: String): PendingIntent {
    val intent = Intent(this, AudioControlsService::class.java).setAction(action)
    return PendingIntent.getService(
      this,
      action.hashCode(),
      intent,
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

    val style = MediaStyleNotificationHelper.MediaStyle(session)

    // Older Android system UI expects explicit notification actions for transport controls.
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
      val compactViewIndices = mutableListOf<Int>()
      var currentIndex = 0

      if (currentOptions?.showSeekBackward == true) {
        builder.addAction(
          NotificationCompat.Action(
            androidx.media3.session.R.drawable.media3_icon_skip_back,
            "Seek Backward",
            buildActionPendingIntent(ACTION_SEEK_BACKWARD)
          )
        )
        compactViewIndices.add(currentIndex)
        currentIndex++
      }

      builder.addAction(
        NotificationCompat.Action(
          if (session.player.isPlaying) {
            androidx.media3.session.R.drawable.media3_icon_pause
          } else {
            androidx.media3.session.R.drawable.media3_icon_play
          },
          if (session.player.isPlaying) "Pause" else "Play",
          buildActionPendingIntent(if (session.player.isPlaying) ACTION_PAUSE else ACTION_PLAY)
        )
      )
      compactViewIndices.add(currentIndex)
      currentIndex++

      if (currentOptions?.showSeekForward == true) {
        builder.addAction(
          NotificationCompat.Action(
            androidx.media3.session.R.drawable.media3_icon_skip_forward,
            "Seek Forward",
            buildActionPendingIntent(ACTION_SEEK_FORWARD)
          )
        )
        compactViewIndices.add(currentIndex)
      }

      style.setShowActionsInCompactView(*compactViewIndices.toIntArray())
    }

    builder.setStyle(style)
    return builder.build()
  }

  private fun updateSessionCustomLayout(isPlaying: Boolean) {
    val session = mediaSession ?: return
    val mediaButtons = mutableListOf<CommandButton>()

    // Add seek backward button if enabled
    if (currentOptions?.showSeekBackward == true) {
      mediaButtons.add(
        CommandButton.Builder(CommandButton.ICON_SKIP_BACK_10)
          .setDisplayName("Seek Backward")
          .setEnabled(true)
          .setSessionCommand(SessionCommand(ACTION_SEEK_BACKWARD, Bundle.EMPTY))
          .setSlots(CommandButton.SLOT_BACK)
          .build()
      )
    }

    // Add play/pause button (always present)
    mediaButtons.add(
      CommandButton.Builder(if (isPlaying) CommandButton.ICON_PAUSE else CommandButton.ICON_PLAY)
        .setDisplayName(if (isPlaying) "Pause" else "Play")
        .setEnabled(true)
        .setPlayerCommand(Player.COMMAND_PLAY_PAUSE)
        .setSlots(CommandButton.SLOT_CENTRAL)
        .build()
    )

    // Add seek forward button if enabled
    if (currentOptions?.showSeekForward == true) {
      mediaButtons.add(
        CommandButton.Builder(CommandButton.ICON_SKIP_FORWARD_10)
          .setDisplayName("Seek Forward")
          .setEnabled(true)
          .setSessionCommand(SessionCommand(ACTION_SEEK_FORWARD, Bundle.EMPTY))
          .setSlots(CommandButton.SLOT_FORWARD)
          .build()
      )
    }

    session.setCustomLayout(mediaButtons)
    session.setMediaButtonPreferences(mediaButtons)
  }

  private fun postOrStartForegroundNotification(startInForeground: Boolean) {
    appContext?.let {
      it.mainQueue.launch {
        postOrStartForegroundNotificationNow(startInForeground)
      }
    } ?: postOrStartForegroundNotificationNow(startInForeground)
  }

  private fun postOrStartForegroundNotificationNow(startInForeground: Boolean) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
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
        appContext?.jsLogger?.error(
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

  private fun resolveSessionPlayer(player: AudioPlayer, options: AudioLockScreenOptions?): Player {
    val isLive = options?.isLiveStream ?: player.isLive
    if (!isLive) {
      return player.ref
    }

    return object : ForwardingPlayer(player.ref) {
      override fun getAvailableCommands(): Player.Commands {
        return super.getAvailableCommands().buildUpon()
          .remove(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM)
          .build()
      }
    }
  }

  private fun setActivePlayerInternal(
    player: AudioPlayer?,
    metadata: Metadata? = null,
    options: AudioLockScreenOptions? = null
  ) {
    appContext?.mainQueue?.launch {
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
      sessionMetadataPlayer = null

      appContext?.mainQueue?.launch {
        val context = appContext?.reactContext ?: return@launch
        val sessionPlayer = MetadataInjectingPlayer(resolveSessionPlayer(player, options)).apply {
          updateMetadata(metadata)
        }
        val session = MediaSession.Builder(context, sessionPlayer)
          .setCallback(AudioMediaSessionCallback())
          .build()

        // Replace the basic media session with a session connected to our playback service.
        player.mediaSession.release()
        player.mediaSession = session

        addSession(session)
        mediaSession = session
        sessionMetadataPlayer = sessionPlayer

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
    sessionMetadataPlayer?.updateMetadata(metadata)
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
    sessionMetadataPlayer = null
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

      mediaSession?.release()
      sessionMetadataPlayer = null
      appContext?.mainQueue?.launch {
        val context = appContext?.reactContext ?: return@launch
        val sessionPlayer = MetadataInjectingPlayer(resolveSessionPlayer(player, options)).apply {
          updateMetadata(metadata)
        }
        val session = MediaSession.Builder(context, sessionPlayer)
          .setCallback(AudioMediaSessionCallback())
          .build()

        player.mediaSession.release()
        player.mediaSession = session

        addSession(session)
        mediaSession = session
        sessionMetadataPlayer = sessionPlayer

        updateSessionCustomLayout(player.ref.isPlaying)
        postOrStartForegroundNotification(startInForeground = false)
      }

      // Reload artwork if metadata has changed
      metadata?.artworkUrl?.let {
        loadArtworkFromUrl(it) { bitmap ->
          currentArtwork = bitmap
          postOrStartForegroundNotification(startInForeground = false)
        }
      }
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
    sessionMetadataPlayer = null
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
    appContext?.mainQueue?.launch {
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
