package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException
import java.lang.ref.WeakReference
import java.util.Objects

internal class NowPlayingCenterState(
  val info: NowPlayingInfo,
  val mediaType: NowPlayingMediaType,
  val isPlaying: Boolean,
  val commands: Set<RemoteCommandKind>,
  owner: NowPlayingOwner? = null
) {
  private val ownerReference = WeakReference(owner)

  val owner: NowPlayingOwner?
    get() = ownerReference.get()

  override fun equals(other: Any?) =
    other is NowPlayingCenterState &&
      other.info == info &&
      other.mediaType == mediaType &&
      other.isPlaying == isPlaying &&
      other.commands == commands &&
      other.owner === owner

  override fun hashCode() = Objects.hash(info, mediaType, isPlaying, commands)

  override fun toString() =
    "NowPlayingCenterState(info=$info, mediaType=${mediaType.raw}, isPlaying=$isPlaying, " +
      "commands=${commands.map { it.raw }})"
}

internal interface NowPlayingCenterBackend {
  fun setCommandHandler(handler: (RemoteCommand) -> Unit)
  fun setFailureHandler(handler: (CodedException) -> Unit)
  fun apply(state: NowPlayingCenterState?)
}

internal object DetachedNowPlayingCenter : NowPlayingCenterBackend {
  override fun setCommandHandler(handler: (RemoteCommand) -> Unit) = Unit

  override fun setFailureHandler(handler: (CodedException) -> Unit) = Unit

  override fun apply(state: NowPlayingCenterState?) = Unit
}

/** Confined to the coordinator thread. */
internal class NowPlayingStack(
  private val center: NowPlayingCenterBackend,
  private val mixingMode: () -> InterruptionMode,
  private val onOwnerChange: (NowPlayingOwner?) -> Unit = {},
  private val isInterrupted: () -> Boolean = { false },
  private val checkThread: () -> Unit = {},
  private val log: (String) -> Unit = {}
) {
  private class Entry(
    val claimId: Long,
    val owner: WeakReference<NowPlayingOwner>,
    val claim: WeakReference<Any>?,
    var info: NowPlayingInfo,
    var commands: Set<RemoteCommandKind>,
    var wasPlaying: Boolean
  ) {
    var pausedByTakeover = false

    val isCollected: Boolean
      get() = owner.get() == null || (claim != null && claim.get() == null)
  }

  private val entries = mutableListOf<Entry>()
  private var nextClaimId = 0L
  private var applied: NowPlayingCenterState? = null

  @Volatile
  private var published: WeakReference<NowPlayingOwner>? = null

  val owner: NowPlayingOwner?
    get() = published?.get()

  fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): Long {
    val claimId = ++nextClaimId
    push(owner, info, commands, claimId, claim = null)
    return claimId
  }

  fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>, claimId: Long, claim: Any) {
    push(owner, info, commands, claimId, WeakReference(claim))
  }

  private fun push(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>,
    claimId: Long,
    claim: WeakReference<Any>?
  ) {
    checkThread()
    settleTop()
    val isPlaying = guarded(false) { owner.isPlaying }
    val previous = entries.lastOrNull()?.owner?.get()
    val topPlays = previous != null && previous !== owner && guarded(false) { previous.isPlaying }
    if (isPlaying && topPlays) {
      pauseTopForTakeover()
    }
    entries.removeAll { it.owner.get() === owner }
    val entry = Entry(claimId, WeakReference(owner), claim, info, commands, isPlaying)
    if (!isPlaying && topPlays) {
      var position = entries.size - 1
      while (position > 0 && entries[position - 1].pausedByTakeover) {
        position -= 1
      }
      entries.add(position, entry)
    } else {
      entries.add(entry)
    }
    publish()
  }

  fun update(claimId: Long, info: NowPlayingInfo, commands: Set<RemoteCommandKind>? = null) {
    checkThread()
    settleTop()
    val entry = entries.firstOrNull { it.claimId == claimId } ?: return
    entry.info = info
    commands?.let { entry.commands = it }
    val isPlaying = entry.owner.get()?.let { guarded(false) { it.isPlaying } } == true
    val startedPlaying = isPlaying && !entry.wasPlaying
    if (startedPlaying) {
      entry.pausedByTakeover = false
    }
    entry.wasPlaying = isPlaying
    if (startedPlaying && entry !== entries.last()) {
      entries.remove(entry)
      pauseTopForTakeover()
      entries.add(entry)
      publish(force = true)
    } else if (entry === entries.last()) {
      publish(force = true)
    }
  }

  fun withdraw(claimId: Long) {
    checkThread()
    entries.removeAll { it.claimId == claimId }
    settleTop()
    publish()
  }

  fun handle(command: RemoteCommand) {
    checkThread()
    settleTop()
    publish()
    val top = entries.lastOrNull() ?: return
    val owner = top.owner.get() ?: return
    if (command.kind in commandsOf(top)) {
      guarded(Unit) { owner.handle(command) }
    }
  }

  fun prune() {
    checkThread()
    if (entries.any { it.isCollected }) {
      settleTop()
      publish()
    }
  }

  fun interruptionEnded(shouldResume: Boolean) {
    checkThread()
    val top = entries.lastOrNull() ?: return
    if (!top.pausedByTakeover) {
      return
    }
    if (shouldResume) {
      settleTop()
    } else {
      top.pausedByTakeover = false
    }
  }

  fun clearClaimReference(claimId: Long) {
    entries.firstOrNull { it.claimId == claimId }?.claim?.clear()
  }

  private fun pauseTopForTakeover() {
    val top = entries.lastOrNull() ?: return
    val previous = top.owner.get() ?: return
    if (guarded(false) { previous.isPlaying } && mixingMode() != InterruptionMode.MIX_WITH_OTHERS) {
      top.pausedByTakeover = true
      top.wasPlaying = true
      guarded(Unit) { previous.pauseForTakeover() }
    }
  }

  private fun settleTop() {
    entries.removeAll { entry ->
      entry.isCollected.also { collected ->
        if (collected && entry.owner.get() != null) {
          log("A Now Playing owner did not withdraw its claim before the claim was garbage collected")
        }
      }
    }
    val top = entries.lastOrNull() ?: return
    val owner = top.owner.get() ?: return
    if (top.pausedByTakeover && !isInterrupted()) {
      top.pausedByTakeover = false
      guarded(Unit) { owner.resumeAfterTakeover() }
    }
  }

  private fun publish(force: Boolean = false) {
    val top = entries.lastOrNull()
    val owner = top?.owner?.get()
    if (owner !== published?.get()) {
      published = owner?.let(::WeakReference)
      onOwnerChange(owner)
    }
    val state = if (top != null && owner != null) {
      NowPlayingCenterState(
        top.info,
        guarded(NowPlayingMediaType.AUDIO) { owner.mediaType },
        guarded(false) { owner.isPlaying },
        commandsOf(top),
        owner
      )
    } else {
      null
    }
    if (force || state != applied) {
      applied = state
      center.apply(state)
    }
  }

  private inline fun <T> guarded(fallback: T, body: () -> T): T =
    try {
      body()
    } catch (e: Exception) {
      log("Now Playing owner failed: $e")
      fallback
    }

  private fun commandsOf(entry: Entry) =
    if (entry.info.isLiveStream) {
      entry.commands - RemoteCommandKind.SEEK
    } else {
      entry.commands
    }
}
