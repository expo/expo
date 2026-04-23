package expo.modules.filesystem

import android.net.Uri
import android.os.FileObserver
import android.os.Handler
import android.os.Looper
import androidx.core.net.toUri
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import java.io.File
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds

private val DEFAULT_DEBOUNCE = 100.milliseconds

// Android's FileObserver does not expose the inotify IN_ISDIR bit.
private const val IN_ISDIR = 0x40000000
private const val WATCH_MASK = FileObserver.CREATE or
  FileObserver.MODIFY or
  FileObserver.DELETE or
  FileObserver.DELETE_SELF or
  FileObserver.MOVED_FROM or
  FileObserver.MOVED_TO or
  FileObserver.MOVE_SELF

internal enum class WatchEventType(val value: String) : Enumerable {
  CREATED("created"),
  MODIFIED("modified"),
  DELETED("deleted"),
  RENAMED("renamed")
}

@OptimizedRecord
internal data class WatchOptions(
  @Field val debounce: Long = DEFAULT_DEBOUNCE.inWholeMilliseconds,
  @Field val events: List<String>? = null
) : Record

@OptimizedRecord
internal data class WatchEventPayload(
  @Field val type: WatchEventType,
  @Field val path: String,
  @Field val isDirectory: Boolean,
  @Field val nativeEventFlags: Int,
  @Field val newPath: String? = null,
  @Field val newPathIsDirectory: Boolean? = null
) : Record

internal class FileSystemWatcher(
  appContext: AppContext,
  uri: Uri,
  options: WatchOptions?
) : SharedObject(appContext) {
  private val handler = Handler(Looper.getMainLooper())
  private val watchedFile: File
  private val watchedUri: Uri
  private val debounceDuration: Duration = (options?.debounce ?: DEFAULT_DEBOUNCE.inWholeMilliseconds).milliseconds
  private val isWatchingDirectory: Boolean

  private val lock = Any()
  private var observer: FileObserver? = null
  private var debounceRunnable: Runnable? = null
  private val pendingEvents = linkedMapOf<String?, MutableList<PendingEvent>>()
  private val pendingMoveFrom = mutableListOf<Pair<String, Boolean>>()

  init {
    if (uri.scheme != "file") {
      throw WatcherUnsupportedPathException(uri.toString())
    }

    val path = uri.path ?: throw WatcherSetupException(uri.toString())
    watchedFile = File(path)
    if (!watchedFile.exists()) {
      throw WatcherPathNotFoundException(path)
    }
    if (!watchedFile.canRead()) {
      throw WatcherPermissionException(path)
    }

    watchedUri = watchedFile.toUri()
    isWatchingDirectory = watchedFile.isDirectory
  }

  fun start() {
    if (observer != null) {
      return
    }

    observer = object : FileObserver(watchedFile.path, WATCH_MASK) {
      override fun onEvent(event: Int, path: String?) {
        handleEvent(event, path)
      }
    }.also {
      it.startWatching()
    }
  }

  fun stop() {
    observer?.stopWatching()
    observer = null

    synchronized(lock) {
      debounceRunnable?.let(handler::removeCallbacks)
      debounceRunnable = null
      pendingEvents.clear()
      pendingMoveFrom.clear()
    }
  }

  private fun handleEvent(event: Int, changedPath: String?) {
    if (event == 0) {
      return
    }

    if (event and (FileObserver.DELETE_SELF or FileObserver.MOVE_SELF) != 0) {
      val eventType = if (event and FileObserver.DELETE_SELF != 0) WatchEventType.DELETED else WatchEventType.RENAMED
      emitEvent(
        type = eventType,
        path = watchedUri.toString(),
        isDirectory = isWatchingDirectory,
        flags = event
      )
      stop()
      return
    }

    val isDirectory = when {
      event and IN_ISDIR != 0 -> true
      changedPath != null -> File(watchedFile, changedPath).isDirectory
      else -> isWatchingDirectory
    }

    synchronized(lock) {
      if (event and FileObserver.MOVED_FROM != 0 && changedPath != null) {
        pendingMoveFrom.add(changedPath to isDirectory)
      }

      pendingEvents.getOrPut(changedPath) { mutableListOf() }.add(PendingEvent(event, isDirectory))

      debounceRunnable?.let(handler::removeCallbacks)
      debounceRunnable = Runnable { flushPendingEvents() }
      handler.postDelayed(debounceRunnable!!, debounceDuration.inWholeMilliseconds)
    }
  }

  private fun flushPendingEvents() {
    val eventsSnapshot: Map<String?, List<PendingEvent>>
    val moveFromEvents: List<Pair<String, Boolean>>

    synchronized(lock) {
      eventsSnapshot = pendingEvents.mapValues { it.value.toList() }
      moveFromEvents = pendingMoveFrom.toList()
      pendingEvents.clear()
      pendingMoveFrom.clear()
      debounceRunnable = null
    }

    val mergedEvents = eventsSnapshot.mapValues { (_, events) ->
      events.fold(0) { acc, pendingEvent -> acc or pendingEvent.flags }
    }
    val movedToEvents = mutableListOf<Pair<String, Boolean>>()

    for ((changedPath, flags) in mergedEvents) {
      if (changedPath != null && flags and FileObserver.MOVED_TO != 0) {
        movedToEvents.add(changedPath to eventsSnapshot[changedPath]!!.any { it.isDirectory })
      }
    }

    val pairedMoveSources = mutableSetOf<String>()
    val pairedMoveDestinations = mutableSetOf<String>()
    val pairedMoveCount = minOf(moveFromEvents.size, movedToEvents.size)

    for (index in 0 until pairedMoveCount) {
      val moveFrom = moveFromEvents[index]
      val movedToInfo = movedToEvents[index]
      val moveFlags = (mergedEvents[moveFrom.first] ?: 0) or (mergedEvents[movedToInfo.first] ?: 0)
      val oldPath = childUri(moveFrom.first)
      val newPath = childUri(movedToInfo.first)
      emitEvent(
        type = WatchEventType.RENAMED,
        path = oldPath,
        isDirectory = moveFrom.second,
        flags = moveFlags,
        newPath = newPath,
        newPathIsDirectory = movedToInfo.second
      )

      pairedMoveSources.add(moveFrom.first)
      pairedMoveDestinations.add(movedToInfo.first)
    }

    for ((changedPath, flags) in mergedEvents) {
      val isDirectory = changedPath?.let { path ->
        eventsSnapshot[path]?.any { it.isDirectory }
      } ?: isWatchingDirectory

      if ((changedPath != null && pairedMoveSources.contains(changedPath)) ||
        (changedPath != null && pairedMoveDestinations.contains(changedPath))
      ) {
        continue
      }

      for (eventType in mapToUnifiedTypes(flags)) {
        emitEvent(
          type = eventType,
          path = childUri(changedPath),
          isDirectory = isDirectory,
          flags = flags
        )
      }
    }
  }

  private fun emitEvent(
    type: WatchEventType,
    path: String,
    isDirectory: Boolean,
    flags: Int,
    newPath: String? = null,
    newPathIsDirectory: Boolean? = null
  ) {
    emit(
      "change",
      WatchEventPayload(
        type = type,
        path = path,
        isDirectory = isDirectory,
        nativeEventFlags = flags,
        newPath = newPath,
        newPathIsDirectory = if (newPath != null) newPathIsDirectory ?: isDirectory else null
      )
    )
  }

  private fun childUri(changedPath: String?): String {
    if (changedPath == null) {
      return watchedUri.toString()
    }
    return File(watchedFile, changedPath).toUri().toString()
  }

  private fun mapToUnifiedTypes(event: Int): List<WatchEventType> {
    val types = mutableListOf<WatchEventType>()

    if (event and FileObserver.CREATE != 0) {
      types.add(WatchEventType.CREATED)
    }
    if (event and FileObserver.MODIFY != 0) {
      types.add(WatchEventType.MODIFIED)
    }
    if (event and FileObserver.DELETE != 0) {
      types.add(WatchEventType.DELETED)
    }
    if (event and (FileObserver.MOVED_FROM or FileObserver.MOVED_TO) != 0) {
      types.add(WatchEventType.RENAMED)
    }

    return types.ifEmpty { listOf(WatchEventType.MODIFIED) }
  }

  private data class PendingEvent(val flags: Int, val isDirectory: Boolean)
}
