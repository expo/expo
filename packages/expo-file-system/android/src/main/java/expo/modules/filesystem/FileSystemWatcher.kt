package expo.modules.filesystem

import android.net.Uri
import android.os.FileObserver
import android.os.Handler
import android.os.Looper
import androidx.core.net.toUri
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import java.io.File

private const val DEFAULT_DEBOUNCE_MS = 100L
private const val MOVE_SELF = 0x00000800
private const val IN_ISDIR = 0x40000000
private const val WATCH_MASK = FileObserver.CREATE or
  FileObserver.MODIFY or
  FileObserver.DELETE or
  FileObserver.DELETE_SELF or
  FileObserver.MOVED_FROM or
  FileObserver.MOVED_TO or
  MOVE_SELF

@OptimizedRecord
internal data class WatchOptions(
  @Field val debounce: Long = DEFAULT_DEBOUNCE_MS,
  @Field val events: List<String>? = null
) : Record

internal class FileSystemWatcher(
  appContext: AppContext,
  uri: Uri,
  options: WatchOptions?
) : SharedObject(appContext) {
  private val handler = Handler(Looper.getMainLooper())
  private val watchedFile: File
  private val watchedUri: Uri
  private val debounceMs = options?.debounce ?: DEFAULT_DEBOUNCE_MS
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

    if (event and (FileObserver.DELETE_SELF or MOVE_SELF) != 0) {
      val eventType = if (event and FileObserver.DELETE_SELF != 0) "deleted" else "renamed"
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
      handler.postDelayed(debounceRunnable!!, debounceMs)
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
        type = "renamed",
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
        (changedPath != null && pairedMoveDestinations.contains(changedPath))) {
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
    type: String,
    path: String,
    isDirectory: Boolean,
    flags: Int,
    newPath: String? = null,
    newPathIsDirectory: Boolean? = null
  ) {
    val payload = mutableMapOf<String, Any?>(
      "type" to type,
      "path" to path,
      "isDirectory" to isDirectory,
      "nativeEventFlags" to flags
    )

    if (newPath != null) {
      payload["newPath"] = newPath
      payload["newPathIsDirectory"] = newPathIsDirectory ?: isDirectory
    }

    emit("change", payload)
  }

  private fun childUri(changedPath: String?): String {
    if (changedPath == null) {
      return watchedUri.toString()
    }
    return File(watchedFile, changedPath).toUri().toString()
  }

  private fun mapToUnifiedTypes(event: Int): List<String> {
    val types = mutableListOf<String>()

    if (event and FileObserver.CREATE != 0) {
      types.add("created")
    }
    if (event and FileObserver.MODIFY != 0) {
      types.add("modified")
    }
    if (event and FileObserver.DELETE != 0) {
      types.add("deleted")
    }
    if (event and (FileObserver.MOVED_FROM or FileObserver.MOVED_TO) != 0) {
      types.add("renamed")
    }

    return types.ifEmpty { listOf("modified") }
  }

  private data class PendingEvent(val flags: Int, val isDirectory: Boolean)
}
