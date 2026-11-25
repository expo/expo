package expo.modules.audio

import android.Manifest
import android.content.ContentResolver
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.media3.common.C.CONTENT_TYPE_DASH
import androidx.media3.common.C.CONTENT_TYPE_HLS
import androidx.media3.common.C.CONTENT_TYPE_OTHER
import androidx.media3.common.C.CONTENT_TYPE_SS
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.Util
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.smoothstreaming.SsMediaSource
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.v2.legacyAppContext
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
@ExpoModule(
  name = "ExpoAudio",
  classes = [AudioPlayer::class, AudioRecorder::class, AudioStream::class, AudioPlaylist::class]
)
class AudioModule : Module() {
  internal val appContext: AppContext
    get() = legacyAppContext
  internal val audioManager: AudioManager by lazy {
    androidContext.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
  }
  private val httpClient = OkHttpClient()

  private val players = ConcurrentHashMap<String, AudioPlayer>()
  private val recorders = ConcurrentHashMap<String, AudioRecorder>()
  private val playlists = ConcurrentHashMap<String, AudioPlaylist>()
  private var shouldPlayInBackground = false
  private var audioEnabled = true
  private var shouldRouteThroughEarpiece = false
  internal var focusAcquired = false
    private set
  private var interruptionMode: InterruptionMode? = null
  private var allowsBackgroundRecording = false
  private var playsInSilentMode = true
  private var isStarted = false
  private var isDestroyed = false
  private var startedContext: android.content.Context? = null
  private var startedReactContext: ReactApplicationContext? = null

  private val allPlayables: Sequence<Playable>
    get() = players.values.asSequence() + playlists.values.asSequence()

  private val allLockScreenPlayables: Sequence<LockScreenPlayable>
    get() = sequence {
      yieldAll(players.values)
      yieldAll(playlists.values)
    }

  private val ringerModeReceiver = RingerModeReceiver {
    if (playsInSilentMode) {
      return@RingerModeReceiver
    }
    appContext.mainQueue.launch {
      allPlayables.forEach { playable ->
        if (playable.isPlaying) {
          playable.pause()
        }
      }
    }
  }

  private var audioFocusRequest: AudioFocusRequest? = null
  private var focusRequestRegistered = false
  private var registeredAudioFocusGain: Int? = null
  private var shouldRefreshFocusOnGain = false
  private val audioSessionActivityKeepers = mutableSetOf<String>()
  private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
    appContext.mainQueue.launch {
      if (!focusRequestRegistered) {
        return@launch
      }
      when (focusChange) {
        AudioManager.AUDIOFOCUS_LOSS -> {
          releaseAudioFocus()
          allPlayables.forEach { playable ->
            playable.isPaused = false
            playable.pause()
          }
        }

        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
          focusAcquired = false
          allPlayables.forEach { playable ->
            if (playable.isPlaying) {
              playable.isPaused = true
              playable.pause()
            }
          }
        }

        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
          if (interruptionMode == InterruptionMode.DUCK_OTHERS) {
            allPlayables.forEach { playable ->
              playable.setVolume(playable.previousVolume * 0.5f, rememberVolume = false)
            }
          } else {
            focusAcquired = false
            allPlayables.forEach { playable ->
              if (playable.isPlaying) {
                playable.isPaused = true
                playable.pause()
              }
            }
          }
        }

        AudioManager.AUDIOFOCUS_GAIN -> {
          focusAcquired = true

          if (shouldRefreshFocusOnGain) {
            val playablesToResume = allPlayables.filter { it.shouldResumeAfterFocus() }.toList()
            shouldRefreshFocusOnGain = false
            releaseAudioFocus()
            allPlayables.forEach { playable ->
              playable.setVolume(playable.previousVolume)
            }

            if (playablesToResume.isEmpty() && audioSessionActivityKeepers.isEmpty()) {
              return@launch
            }

            if (!audioEnabled || !shouldPlayInSilentMode()) {
              playablesToResume.forEach { playable ->
                playable.isPaused = false
                playable.pause()
              }
              return@launch
            }

            when (requestAudioFocus()) {
              AudioFocusResult.GRANTED,
              AudioFocusResult.NOT_REQUESTED -> resumeInterruptedPlayables(playablesToResume)
              AudioFocusResult.DELAYED -> playablesToResume.forEach { playable ->
                playable.isPaused = true
                playable.pause()
              }
              AudioFocusResult.FAILED -> playablesToResume.forEach { playable ->
                playable.isPaused = false
                playable.pause()
              }
            }
            return@launch
          }

          if (!audioEnabled || !shouldPlayInSilentMode()) {
            return@launch
          }

          allPlayables.forEach { playable ->
            playable.setVolume(playable.previousVolume)
            if (playable.isPaused) {
              playable.isPaused = false
              playable.play()
            }
          }
        }
      }
    }
  }

  internal fun releaseAudioFocusIfUnused() {
    if (!focusRequestRegistered || audioSessionActivityKeepers.isNotEmpty()) {
      return
    }

    val focusIsStillNeeded = if (focusAcquired) {
      allPlayables.any { it.isPlaying || it.hasActivePlaybackIntent() }
    } else {
      allPlayables.any { it.shouldResumeAfterFocus() }
    }
    if (!focusIsStillNeeded) {
      releaseAudioFocus()
    }
  }

  private fun Playable.hasActivePlaybackIntent(): Boolean {
    return player.playWhenReady &&
      player.playerError == null &&
      (player.playbackState == Player.STATE_BUFFERING || player.playbackState == Player.STATE_READY)
  }

  private fun Playable.shouldResumeAfterFocus(): Boolean {
    return isPaused || hasActivePlaybackIntent()
  }

  internal fun shouldPlayInSilentMode(): Boolean {
    return playsInSilentMode || audioManager.ringerMode == AudioManager.RINGER_MODE_NORMAL
  }

  internal enum class AudioFocusResult { GRANTED, DELAYED, FAILED, NOT_REQUESTED }

  private fun audioFocusGainForMode(mode: InterruptionMode?): Int? = mode?.toAudioFocusGain()

  internal fun requestAudioFocus(): AudioFocusResult {
    if (focusAcquired) {
      return AudioFocusResult.GRANTED
    }
    if (!audioEnabled) {
      return AudioFocusResult.NOT_REQUESTED
    }

    val requestType = audioFocusGainForMode(interruptionMode) ?: return AudioFocusResult.NOT_REQUESTED

    val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest = AudioFocusRequest.Builder(requestType).run {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()
        )
        setAcceptsDelayedFocusGain(true)
        setOnAudioFocusChangeListener(audioFocusChangeListener)
        build()
      }
      audioFocusRequest?.let {
        audioManager.requestAudioFocus(it)
      } ?: AudioManager.AUDIOFOCUS_REQUEST_FAILED
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(audioFocusChangeListener, AudioManager.STREAM_MUSIC, requestType)
    }

    return when (result) {
      AudioManager.AUDIOFOCUS_REQUEST_GRANTED -> {
        shouldRefreshFocusOnGain = false
        focusRequestRegistered = true
        registeredAudioFocusGain = requestType
        focusAcquired = true
        AudioFocusResult.GRANTED
      }
      // The system can grant focus later through the listener, so this is not a failure.
      AudioManager.AUDIOFOCUS_REQUEST_DELAYED -> {
        shouldRefreshFocusOnGain = false
        focusRequestRegistered = true
        registeredAudioFocusGain = requestType
        focusAcquired = false
        AudioFocusResult.DELAYED
      }
      else -> {
        appContext.jsLogger?.warn(
          "expo-audio couldn't acquire audio focus, so playback won't start. On Android an app can't " +
            "play in the background without an active media playback foreground service. Call " +
            "setActiveForLockScreen(true) on the player to keep playback alive in the background."
        )
        AudioFocusResult.FAILED
      }
    }
  }

  private fun releaseAudioFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest?.let {
        audioManager.abandonAudioFocusRequest(it)
      }
      audioFocusRequest = null
    } else {
      if (focusRequestRegistered) {
        @Suppress("DEPRECATION")
        audioManager.abandonAudioFocus(audioFocusChangeListener)
      }
    }
    focusRequestRegistered = false
    registeredAudioFocusGain = null
    shouldRefreshFocusOnGain = false
    focusAcquired = false
  }

  // Called on the main thread, from JS and from outside it (see `Playable.onPlayRequest`).
  internal fun playWithAudioFocus(playable: Playable) {
    if (!audioEnabled) {
      Log.e(TAG, "Audio has been disabled. Re-enable to start playing")
      return
    }
    if (!shouldPlayInSilentMode()) {
      return
    }
    val focusResult = requestAudioFocus()
    if (focusResult == AudioFocusResult.FAILED) {
      return
    }
    (playable as? AudioPlayer)?.let { registerAudioSessionActivityKeeper(it) }
    if (focusResult == AudioFocusResult.DELAYED) {
      // The AUDIOFOCUS_GAIN branch starts it once the system grants focus.
      playable.isPaused = true
      return
    }
    playable.play()
  }

  private fun registerAudioSessionActivityKeeper(player: AudioPlayer) {
    if (player.keepAudioSessionActive) {
      audioSessionActivityKeepers.add(player.id)
    }
  }

  internal fun removePlayer(playerId: String) {
    players.remove(playerId)
    audioSessionActivityKeepers.remove(playerId)
    releaseAudioFocusIfUnused()
  }

  private fun updateAudioFocusForModeChange(previousMode: InterruptionMode?) {
    if (audioFocusGainForMode(previousMode) == audioFocusGainForMode(interruptionMode)) {
      return
    }

    runOnMain {
      if (focusRequestRegistered && !focusAcquired) {
        val hasPlaybackIntent = audioSessionActivityKeepers.isNotEmpty() || allPlayables.any { it.shouldResumeAfterFocus() }
        if (!hasPlaybackIntent) {
          releaseAudioFocus()
          return@runOnMain
        }
        shouldRefreshFocusOnGain = registeredAudioFocusGain != audioFocusGainForMode(interruptionMode)
        return@runOnMain
      }

      val playablesWithPlaybackIntent = allPlayables.filter { it.hasActivePlaybackIntent() }.toList()
      if (playablesWithPlaybackIntent.isEmpty() && audioSessionActivityKeepers.isEmpty() && !focusAcquired) {
        return@runOnMain
      }
      releaseAudioFocus()

      if (playablesWithPlaybackIntent.isNotEmpty() || audioSessionActivityKeepers.isNotEmpty()) {
        val focusResult = requestAudioFocus()
        allPlayables.forEach { playable ->
          playable.setVolume(playable.previousVolume)
        }
        when (focusResult) {
          AudioFocusResult.GRANTED,
          AudioFocusResult.NOT_REQUESTED -> Unit
          AudioFocusResult.DELAYED -> {
            playablesWithPlaybackIntent.forEach { playable ->
              playable.isPaused = true
              playable.pause()
            }
          }
          AudioFocusResult.FAILED -> {
            playablesWithPlaybackIntent.forEach { playable ->
              playable.isPaused = false
              playable.pause()
            }
          }
        }
      }
    }
  }

  private fun resumeInterruptedPlayables(playables: List<Playable>) {
    val canResume = audioEnabled && shouldPlayInSilentMode()
    playables.forEach { playable ->
      playable.setVolume(playable.previousVolume)
      playable.isPaused = false
      if (canResume) {
        playable.play()
      }
    }
  }

  private val lifecycleListener = object : LifecycleEventListener {
    override fun onHostResume() = onActivityEntersForeground()

    override fun onHostPause() = onActivityEntersBackground()

    override fun onHostDestroy() = Unit
  }

  // Expo Modules API 2.0 has no OnCreate hook, so the receivers start with the first object that needs them.
  @Synchronized
  internal fun ensureStarted() {
    if (isStarted || isDestroyed) {
      return
    }
    startedContext = androidContext.also {
      it.registerReceiver(ringerModeReceiver, IntentFilter(AudioManager.RINGER_MODE_CHANGED_ACTION))
    }
    startedReactContext = reactContextOrNull?.also {
      it.addLifecycleEventListener(lifecycleListener)
    }
    isStarted = true
  }

  @JS
  suspend fun setAudioModeAsync(mode: AudioMode): Unit = background {
    ensureStarted()
    val previousInterruptionMode = interruptionMode
    shouldPlayInBackground = mode.shouldPlayInBackground ?: shouldPlayInBackground
    interruptionMode = mode.interruptionMode ?: previousInterruptionMode
    playsInSilentMode = mode.playsInSilentMode ?: playsInSilentMode
    mode.shouldRouteThroughEarpiece?.let { updatePlaySoundThroughEarpiece(it) }
    allowsBackgroundRecording = mode.allowsBackgroundRecording ?: allowsBackgroundRecording

    recorders.values.forEach { recorder ->
      recorder.useForegroundService = allowsBackgroundRecording
    }

    allLockScreenPlayables.forEach { playable ->
      playable.serviceConnection.playsInSilentMode = playsInSilentMode
      playable.serviceConnection.playbackServiceBinder?.service?.playsInSilentMode = playsInSilentMode
    }

    if (!shouldPlayInSilentMode()) {
      runOnMain {
        allPlayables.forEach { playable ->
          if (playable.isPlaying) {
            playable.pause()
          }
        }
      }
    }

    updateAudioFocusForModeChange(previousInterruptionMode)
  }

  @JS
  suspend fun setIsAudioActiveAsync(enabled: Boolean): Unit = background {
    audioEnabled = enabled
    if (!enabled) {
      runOnMain {
        audioSessionActivityKeepers.clear()
        releaseAudioFocus()
        allPlayables.forEach {
          it.isPaused = false
          if (it.isPlaying) {
            it.pause()
          }
        }
      }
    }
  }

  @JS
  suspend fun requestRecordingPermissionsAsync(): Map<String, Any?> = permissionsRequest { permissions, promise ->
    Permissions.askForPermissionsWithPermissionsManager(permissions, promise, Manifest.permission.RECORD_AUDIO)
  }

  @JS
  suspend fun requestNotificationPermissionsAsync(): Map<String, Any?> = permissionsRequest { permissions, promise ->
    Permissions.askForPermissionsWithPermissionsManager(permissions, promise, Manifest.permission.POST_NOTIFICATIONS)
  }

  @JS
  suspend fun getRecordingPermissionsAsync(): Map<String, Any?> = permissionsRequest { permissions, promise ->
    Permissions.getPermissionsWithPermissionsManager(permissions, promise, Manifest.permission.RECORD_AUDIO)
  }

  @JS
  suspend fun preload(source: AudioSource, @Suppress("UNUSED_PARAMETER") preferredForwardBufferDuration: Double): Unit = background {
    val uriString = source.uri ?: return@background
    val uri = resolveSourceUri(uriString)
    val factory = when (uri.scheme) {
      "http", "https" -> httpDataSourceFactory(source.headers)
      else -> DefaultDataSource.Factory(androidContext)
    }
    AudioPreloadManager.preload(uriString, uri, factory)
  }

  @JS
  suspend fun clearPreloadedSource(source: AudioSource): Unit = background {
    val uri = source.uri ?: return@background
    AudioPreloadManager.clearSource(uri)
  }

  @JS
  suspend fun clearAllPreloadedSources(): Unit = background {
    AudioPreloadManager.clearAll()
  }

  @JS
  suspend fun getPreloadedSources(): List<String> = background {
    AudioPreloadManager.getPreloadedSources()
  }

  private fun onActivityEntersBackground() {
    if (!shouldPlayInBackground) {
      if (audioSessionActivityKeepers.isEmpty()) {
        releaseAudioFocus()
      }
      allPlayables.forEach { playable ->
        if (playable.isPlaying) {
          playable.isPaused = true
          playable.pause()
        }
      }
    }
    if (!allowsBackgroundRecording) {
      recorders.values.forEach { recorder ->
        recorder.pauseForSystem()
      }
    }
  }

  private fun onActivityEntersForeground() {
    if (!shouldPlayInBackground) {
      if (!shouldPlayInSilentMode()) {
        return
      }

      val interruptedPlayables = allPlayables.filter { it.isPaused }.toList()
      if (interruptedPlayables.isNotEmpty()) {
        when (requestAudioFocus()) {
          AudioFocusResult.GRANTED,
          AudioFocusResult.NOT_REQUESTED -> resumeInterruptedPlayables(interruptedPlayables)
          AudioFocusResult.DELAYED -> Unit
          AudioFocusResult.FAILED -> interruptedPlayables.forEach { it.isPaused = false }
        }
      }
    }
    if (!allowsBackgroundRecording) {
      recorders.values.forEach { recorder ->
        recorder.resumeAfterSystemPause()
      }
    }
    if (shouldRouteThroughEarpiece) {
      updatePlaySoundThroughEarpiece(true)
    }
  }

  @OptIn(DelicateCoroutinesApi::class)
  override fun onDestroy() {
    synchronized(this) {
      isDestroyed = true
      startedContext?.unregisterReceiver(ringerModeReceiver)
      startedReactContext?.removeLifecycleEventListener(lifecycleListener)
      startedContext = null
      startedReactContext = null
    }
    GlobalScope.launch(Dispatchers.Main) {
      audioSessionActivityKeepers.clear()
      releaseAudioFocus()
      players.values.forEach {
        it.ref.stop()
      }

      playlists.values.forEach {
        it.ref.stop()
      }

      recorders.values.forEach {
        it.stopRecording()
      }
      AudioPreloadManager.clearAll()
    }
  }

  @OptIn(DelicateCoroutinesApi::class)
  internal fun registerPlayer(player: AudioPlayer, keepAudioSessionActive: Boolean) {
    ensureStarted()
    player.keepAudioSessionActive = keepAudioSessionActive

    val playerId = player.id
    player.onRelease = {
      // The app context's main queue is cancelled during reload, so release bookkeeping must
      // use the same reload-safe scope as BaseAudioPlayer.sharedObjectDidRelease().
      GlobalScope.launch(Dispatchers.Main) {
        removePlayer(playerId)
      }
    }
    player.onPlaybackStateChange = { isPlaying ->
      if (!isPlaying) {
        releaseAudioFocusIfUnused()
      }
    }
    player.onPlayRequest = { playWithAudioFocus(player) }
    players[player.id] = player
  }

  internal fun registerPlaylist(playlist: AudioPlaylist) {
    ensureStarted()
    playlist.onPlaybackStateChange = { isPlaying ->
      if (!isPlaying) {
        releaseAudioFocusIfUnused()
      }
    }
    playlist.onPlayRequest = { playWithAudioFocus(playlist) }
    playlists[playlist.id] = playlist
  }

  internal fun registerRecorder(recorder: AudioRecorder) {
    ensureStarted()
    recorder.useForegroundService = allowsBackgroundRecording
    recorders[recorder.id] = recorder
  }

  internal fun pause(playable: Playable) {
    runOnMain {
      playable.isPaused = false
      playable.player.pause()
      releaseAudioFocusIfUnused()
    }
  }

  internal fun replace(player: AudioPlayer, source: AudioSource?) {
    runOnMain {
      if (player.ref.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
        if (source == null) {
          player.clearMediaSource()
          player.isPaused = false
          releaseAudioFocusIfUnused()
          return@runOnMain
        }
        val mediaSource = createMediaItem(source)
        val wasPlaying = player.ref.isPlaying
        mediaSource?.let {
          player.setMediaSource(it)
          if (wasPlaying) {
            if (!shouldPlayInSilentMode()) {
              return@runOnMain
            }
            if (!focusAcquired && requestAudioFocus() == AudioFocusResult.FAILED) {
              return@runOnMain
            }
            player.ref.play()
          }
        }
      }
    }
  }

  internal fun removePlaylistTrack(playlist: AudioPlaylist, index: Int) {
    runOnMain {
      playlist.remove(index)
      if (playlist.trackCount == 0) {
        playlist.isPaused = false
        releaseAudioFocusIfUnused()
      }
    }
  }

  internal fun clearPlaylist(playlist: AudioPlaylist) {
    runOnMain {
      playlist.clear()
      playlist.isPaused = false
      releaseAudioFocusIfUnused()
    }
  }

  internal fun destroyPlaylist(playlist: AudioPlaylist) {
    runOnMain {
      playlist.clearLockScreenControls()
      playlists.remove(playlist.id)
      releaseAudioFocusIfUnused()
    }
  }

  internal fun createMediaItem(source: AudioSource?): MediaSource? = source?.uri?.let { uriString ->
    val uri = uriString.toUri()
    val mediaItem = MediaItem.fromUri(resolveSourceUri(uriString))

    val preloadedBytes = AudioPreloadManager.get(uriString)
    val factory: DataSource.Factory = if (preloadedBytes != null) {
      InMemoryDataSourceFactory(preloadedBytes)
    } else {
      when (uri.scheme) {
        "http", "https" -> httpDataSourceFactory(source.headers)
        else -> DefaultDataSource.Factory(androidContext)
      }
    }
    return buildMediaSourceFactory(factory, mediaItem)
  }

  private fun httpDataSourceFactory(headers: Map<String, String>?): DataSource.Factory {
    return OkHttpDataSource.Factory(httpClient).apply {
      headers?.let { headers ->
        setDefaultRequestProperties(headers)
      }
    }
  }

  // Bundled assets arrive as a bare resource name (embedded bundle) or as
  // `file:///android_res/raw/...` (expo-updates). Neither can be opened as a file.
  private fun resolveSourceUri(uriString: String): Uri {
    val uri = uriString.toUri()
    return if (isRawResource(uri)) {
      getRawResourceURI(getResourceName(uri, uriString))
    } else {
      uri
    }
  }

  private fun isRawResource(uri: Uri): Boolean =
    uri.scheme == null || (uri.scheme == "file" && uri.path?.startsWith("/android_res/raw/") == true)

  private fun getResourceName(uri: Uri, fallback: String): String =
    if (uri.scheme == null) {
      fallback
    } else {
      uri.path?.substringAfterLast("/")?.substringBeforeLast(".") ?: fallback
    }

  private fun getRawResourceURI(file: String): Uri {
    val resId = androidContext.resources.getIdentifier(file, "raw", androidContext.packageName)

    return when {
      resId == 0 ->
        Uri.fromFile(File(file))
      else ->
        Uri.Builder()
          .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
          .authority(androidContext.packageName)
          .appendPath("raw")
          .appendPath(file)
          .build()
    }
  }

  @Suppress("DEPRECATION")
  private fun updatePlaySoundThroughEarpiece(playThroughEarpiece: Boolean) {
    audioManager.mode = if (playThroughEarpiece) {
      AudioManager.MODE_IN_COMMUNICATION
    } else {
      AudioManager.MODE_NORMAL
    }
    audioManager.setSpeakerphoneOn(!playThroughEarpiece)
  }

  private fun retrieveStreamType(uri: Uri): Int = Util.inferContentType(uri)

  private fun buildMediaSourceFactory(
    factory: DataSource.Factory,
    mediaItem: MediaItem
  ): MediaSource {
    val uri = mediaItem.localConfiguration?.uri
    return when (val type = uri?.let { retrieveStreamType(it) }) {
      CONTENT_TYPE_SS -> SsMediaSource.Factory(factory)
      CONTENT_TYPE_DASH -> DashMediaSource.Factory(factory)
      CONTENT_TYPE_HLS -> HlsMediaSource.Factory(factory)
      CONTENT_TYPE_OTHER -> ProgressiveMediaSource.Factory(factory)
      else -> throw IllegalStateException("Unsupported type: $type")
    }.createMediaSource(mediaItem)
  }

  internal fun <T> runOnMain(block: () -> T): T =
    runBlocking(appContext.mainQueue.coroutineContext) { block() }

  internal fun checkRecordingPermission() {
    val permission = ContextCompat.checkSelfPermission(appContext.throwingActivity.applicationContext, Manifest.permission.RECORD_AUDIO)
    if (permission != PackageManager.PERMISSION_GRANTED) {
      throw AudioPermissionsException()
    }
  }

  // Async calls run one at a time, in JS call order.
  private val serialDispatcher = Dispatchers.Default.limitedParallelism(1)

  internal suspend fun <T> background(block: suspend () -> T): T = withContext(serialDispatcher) { block() }

  private suspend fun permissionsRequest(
    request: (Permissions?, Promise) -> Unit
  ): Map<String, Any?> = suspendCancellableCoroutine { continuation ->
    request(
      appContext.permissions,
      object : Promise {
        override fun resolve(value: Any?) {
          continuation.resume((value as? Bundle)?.toMap() ?: emptyMap())
        }

        override fun reject(code: String?, message: String?, cause: Throwable?) {
          continuation.resumeWithException(CodedException(code, message, cause))
        }
      }
    )
  }

  companion object {
    val TAG: String = AudioModule::class.java.simpleName
  }
}
