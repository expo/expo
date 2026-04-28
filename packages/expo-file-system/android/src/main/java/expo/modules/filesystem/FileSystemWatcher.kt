package expo.modules.filesystem

import android.net.Uri
import android.os.FileObserver
import androidx.core.net.toUri
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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
  private val backgroundCoroutineScope = appContext.backgroundCoroutineScope
  private val watchedFile: File
  private val watchedUri: Uri
  private val debounceDuration: Duration = options?.debounce?.milliseconds ?: DEFAULT_DEBOUNCE
  private val isWatchingDirectory: Boolean

  private val lock = Any()
  private var observer: FileObserver? = null
  private var debounceJob: Job? = null
  private val pendingEvents = linkedMapOf<String?, MutableList<PendingEvent>>()
  private val pendingMoveFrom = mutableListOf<PendingMove>()

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
        handleEvent(RawWatchEvent(WatchEventFlags(event), path))
      }
    }.also {
      it.startWatching()
    }
  }

  fun stop() {
    observer?.stopWatching()
    observer = null

    synchronized(lock) {
      debounceJob?.cancel()
      debounceJob = null
      pendingEvents.clear()
      pendingMoveFrom.clear()
    }
  }

  private fun handleEvent(event: RawWatchEvent) {
    if (event.isEmpty) {
      return
    }

    if (event.isSelfEvent) {
      emitEvent(
        type = event.selfEventType,
        path = watchedUri.toString(),
        isDirectory = isWatchingDirectory,
        flags = event.flags
      )
      stop()
      return
    }

    val isDirectory = event.resolveIsDirectory(watchedFile, isWatchingDirectory)

    synchronized(lock) {
      if (event.flags.isMoveFrom && event.changedPath != null) {
        pendingMoveFrom.add(PendingMove(event.changedPath, isDirectory))
      }

      pendingEvents.getOrPut(event.changedPath) { mutableListOf() }.add(PendingEvent(event, isDirectory))

      debounceJob?.cancel()
      debounceJob = backgroundCoroutineScope.launch {
        delay(debounceDuration.inWholeMilliseconds)
        flushPendingEvents()
      }
    }
  }

  private fun flushPendingEvents() {
    val eventsSnapshot: Map<String?, List<PendingEvent>>
    val moveFromEvents: List<PendingMove>

    synchronized(lock) {
      eventsSnapshot = pendingEvents.mapValues { it.value.toList() }
      moveFromEvents = pendingMoveFrom.toList()
      pendingEvents.clear()
      pendingMoveFrom.clear()
      debounceJob = null
    }

    val mergedEvents = mergeEvents(eventsSnapshot)
    val pairedMoves = emitPairedMoveEvents(moveFromEvents, mergedEvents)
    emitUnpairedEvents(mergedEvents, pairedMoves)
  }

  private fun mergeEvents(eventsSnapshot: Map<String?, List<PendingEvent>>): List<MergedEvent> {
    return eventsSnapshot.map { (changedPath, events) ->
      MergedEvent(
        changedPath = changedPath,
        flags = events.fold(WatchEventFlags.NONE) { flags, pendingEvent -> flags or pendingEvent.flags },
        isDirectory = events.any { it.isDirectory }
      )
    }
  }

  private fun emitPairedMoveEvents(
    moveFromEvents: List<PendingMove>,
    mergedEvents: List<MergedEvent>
  ): PairedMoves {
    val movedToEvents = mergedEvents
      .mapNotNull { event ->
        event.changedPath
          ?.takeIf { event.flags.isMoveTo }
          ?.let { PendingMove(it, event.isDirectory) }
      }
    val pairedMoves = PairedMoves()
    val pairedMoveCount = minOf(moveFromEvents.size, movedToEvents.size)

    for (index in 0 until pairedMoveCount) {
      val moveFrom = moveFromEvents[index]
      val moveTo = movedToEvents[index]
      val moveFlags = mergedEvents.flagsFor(moveFrom.path) or mergedEvents.flagsFor(moveTo.path)

      emitEvent(
        type = WatchEventType.RENAMED,
        path = childUri(moveFrom.path),
        isDirectory = moveFrom.isDirectory,
        flags = moveFlags,
        newPath = childUri(moveTo.path),
        newPathIsDirectory = moveTo.isDirectory
      )

      pairedMoves.sources.add(moveFrom.path)
      pairedMoves.destinations.add(moveTo.path)
    }

    return pairedMoves
  }

  private fun emitUnpairedEvents(mergedEvents: List<MergedEvent>, pairedMoves: PairedMoves) {
    for (event in mergedEvents) {
      if (event.isPairedMove(pairedMoves)) {
        continue
      }

      for (eventType in event.flags.toUnifiedTypes()) {
        emitEvent(
          type = eventType,
          path = childUri(event.changedPath),
          isDirectory = event.isDirectory,
          flags = event.flags
        )
      }
    }
  }

  private fun emitEvent(
    type: WatchEventType,
    path: String,
    isDirectory: Boolean,
    flags: WatchEventFlags,
    newPath: String? = null,
    newPathIsDirectory: Boolean? = null
  ) {
    emit(
      "change",
      WatchEventPayload(
        type = type,
        path = path,
        isDirectory = isDirectory,
        nativeEventFlags = flags.rawValue,
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

  private data class PendingEvent(val event: RawWatchEvent, val isDirectory: Boolean) {
    val flags: WatchEventFlags
      get() = event.flags
  }

  private data class PendingMove(val path: String, val isDirectory: Boolean)

  private data class MergedEvent(
    val changedPath: String?,
    val flags: WatchEventFlags,
    val isDirectory: Boolean
  ) {
    fun isPairedMove(pairedMoves: PairedMoves): Boolean {
      return changedPath != null &&
        (pairedMoves.sources.contains(changedPath) || pairedMoves.destinations.contains(changedPath))
    }
  }

  private data class PairedMoves(
    val sources: MutableSet<String> = mutableSetOf(),
    val destinations: MutableSet<String> = mutableSetOf()
  )

  private data class RawWatchEvent(val flags: WatchEventFlags, val changedPath: String?) {
    val isEmpty: Boolean
      get() = flags.isEmpty

    val isSelfEvent: Boolean
      get() = flags.isSelfEvent

    val selfEventType: WatchEventType
      get() = if (flags.isSelfDelete) WatchEventType.DELETED else WatchEventType.RENAMED

    fun resolveIsDirectory(watchedFile: File, defaultValue: Boolean): Boolean {
      return when {
        flags.isDirectory -> true
        changedPath != null -> File(watchedFile, changedPath).isDirectory
        else -> defaultValue
      }
    }
  }

  @JvmInline
  private value class WatchEventFlags(val rawValue: Int) {
    val isEmpty: Boolean
      get() = rawValue == 0

    val isDirectory: Boolean
      get() = contains(IN_ISDIR)

    val isMoveFrom: Boolean
      get() = contains(FileObserver.MOVED_FROM)

    val isMoveTo: Boolean
      get() = contains(FileObserver.MOVED_TO)

    val isSelfDelete: Boolean
      get() = contains(FileObserver.DELETE_SELF)

    val isSelfMove: Boolean
      get() = contains(FileObserver.MOVE_SELF)

    val isSelfEvent: Boolean
      get() = isSelfDelete || isSelfMove

    operator fun contains(flag: Int): Boolean {
      return rawValue and flag != 0
    }

    infix fun or(other: WatchEventFlags): WatchEventFlags {
      return WatchEventFlags(rawValue or other.rawValue)
    }

    fun toUnifiedTypes(): List<WatchEventType> {
      val types = mutableListOf<WatchEventType>()

      if (contains(FileObserver.CREATE)) {
        types.add(WatchEventType.CREATED)
      }
      if (contains(FileObserver.MODIFY)) {
        types.add(WatchEventType.MODIFIED)
      }
      if (contains(FileObserver.DELETE)) {
        types.add(WatchEventType.DELETED)
      }
      if (isMoveFrom || isMoveTo) {
        types.add(WatchEventType.RENAMED)
      }

      return types.ifEmpty { listOf(WatchEventType.MODIFIED) }
    }

    companion object {
      val NONE = WatchEventFlags(0)
    }
  }

  private fun List<MergedEvent>.flagsFor(path: String): WatchEventFlags {
    return firstOrNull { it.changedPath == path }?.flags ?: WatchEventFlags.NONE
  }
}
