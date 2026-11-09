package expo.modules.mediasession

import android.media.AudioAttributes
import android.media.AudioManager
import android.util.Log
import androidx.annotation.VisibleForTesting
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

internal class SessionCoordinator(
  private val backend: SessionBackend,
  dispatcher: CoroutineDispatcher
) {
  internal class Snapshot(
    val useCount: Int = 0,
    val heldFocus: FocusSpec? = null,
    val isFocusDelayed: Boolean = false,
    val pendingActivationCount: Int = 0
  )

  private class Entry(
    val id: Long,
    val client: String,
    var requirements: SessionRequirements,
    val token: WeakReference<Any>,
    val activation: CompletableDeferred<Unit>
  )

  private enum class LossState { NONE, DUCKED, TRANSIENT, PERMANENT }

  var log: (String) -> Unit = { Log.w(TAG, it) }

  var onTask: () -> Unit = {}

  private val scope = CoroutineScope(
    SupervisorJob() + dispatcher + CoroutineExceptionHandler { _, error ->
      log("Coordinator task failed: $error")
    }
  )
  private val policyState = AtomicReference(AudioPolicy.DEFAULT)
  private val nextId = AtomicLong()
  private val releaseGeneration = AtomicLong()

  private val entries = mutableListOf<Entry>()
  private val observers = mutableListOf<Pair<Long, MediaSessionObserver>>()
  private val pendingActivations = mutableListOf<CompletableDeferred<Unit>>()
  private var suspendCount = 0
  private var activated = false
  private var currentFocus: FocusSpec? = null
  private var focusDelayed = false
  private var releaseJob: Job? = null
  private var current = LossState.NONE
  private var reported = LossState.NONE
  private var isSilent: Boolean? = null

  @Volatile
  private var snapshot = Snapshot()

  val policy: AudioPolicy
    get() = policyState.get()

  @get:VisibleForTesting
  val useCount: Int
    get() = snapshot.useCount

  @get:VisibleForTesting
  val heldFocus: FocusSpec?
    get() = snapshot.heldFocus

  @get:VisibleForTesting
  val isFocusDelayed: Boolean
    get() = snapshot.isFocusDelayed

  @get:VisibleForTesting
  val pendingActivationCount: Int
    get() = snapshot.pendingActivationCount

  // Coordinator thread only.
  val effectiveInterruptionMode: InterruptionMode
    get() = SessionResolver.resolve(policy, entries.map { it.requirements }).interruptionMode

  init {
    backend.onFocusChange = ::onFocusChange
  }

  fun nextId(): Long = nextId.incrementAndGet()

  fun begin(
    id: Long,
    client: String,
    requirements: SessionRequirements,
    activation: CompletableDeferred<Unit>,
    token: Any
  ) {
    releaseGeneration.incrementAndGet()
    val reference = WeakReference(token)
    task {
      entries.add(Entry(id, client, requirements, reference, activation))
      reconcile(client, activating = true, activation)
    }.invokeOnCompletion { cause ->
      when (cause) {
        null -> Unit
        is CancellationException -> activation.completeExceptionally(
          MediaSessionException(
            "Audio focus was not requested for $client because the media session manager shut down. " +
              "Begin a new use on a running manager",
            cause
          )
        )
        else -> activation.completeExceptionally(
          MediaSessionException(
            "Audio focus was not requested for $client because the coordinator task failed: $cause. " +
              "Begin the use again, and report the cause if it repeats",
            cause
          )
        )
      }
    }
  }

  fun update(id: Long, requirements: SessionRequirements) {
    task {
      val entry = entries.firstOrNull { it.id == id } ?: return@task
      entry.requirements = requirements
      reconcile(entry.client, activating = false, activation = null)
    }
  }

  fun end(id: Long) {
    task {
      val entry = entries.firstOrNull { it.id == id } ?: return@task
      entries.remove(entry)
      pendingActivations.remove(entry.activation)
      if (entries.isEmpty()) {
        scheduleRelease()
      } else {
        reconcile(client = null, activating = false, activation = null)
      }
    }
  }

  fun setPolicy(update: AudioPolicyUpdate) {
    policyState.updateAndGet { it.merged(update) }
    task {
      reconcile(client = null, activating = false, activation = null)
    }
  }

  fun suspendWrites(reason: String) {
    task {
      suspendCount += 1
      if (suspendCount != 1) {
        return@task
      }
      cancelRelease()
      notify { it.mediaSessionDidSuspendWrites(reason) }
    }
  }

  fun resumeWrites() {
    task {
      if (suspendCount == 0) {
        return@task
      }
      suspendCount -= 1
      if (suspendCount != 0) {
        return@task
      }
      notify { it.mediaSessionDidResumeWrites() }
      if (entries.isEmpty()) {
        scheduleRelease()
        return@task
      }
      val previousFocus = currentFocus
      currentFocus = null
      focusDelayed = false
      reconcile(client = null, activating = true, activation = null)
      if (previousFocus != null && currentFocus == null) {
        abandon()
      }
      publish()
      if (current == LossState.PERMANENT && focusDelayed) {
        current = LossState.TRANSIENT
        reported = LossState.TRANSIENT
      }
    }
  }

  fun onFocusChange(change: Int) {
    task {
      val focus = currentFocus ?: return@task
      val pausesWhenDucked = focus.pausesWhenDucked || focus.contentType == AudioAttributes.CONTENT_TYPE_SPEECH
      when (change) {
        AudioManager.AUDIOFOCUS_GAIN -> onFocusGained()
        AudioManager.AUDIOFOCUS_LOSS -> onFocusLost()
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> if (!focusDelayed) {
          current = LossState.TRANSIENT
        }
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> if (!focusDelayed && pausesWhenDucked) {
          current = LossState.TRANSIENT
        } else if (!focusDelayed && current == LossState.NONE) {
          current = LossState.DUCKED
        }
      }
    }
  }

  fun onBecomingNoisy() {
    task {
      notify { it.mediaSessionRouteChanged(RouteChangeReason.OLD_DEVICE_UNAVAILABLE) }
    }
  }

  fun onRingerModeChanged(ringerMode: Int) {
    task {
      val silent = ringerMode != AudioManager.RINGER_MODE_NORMAL
      val previous = isSilent
      isSilent = silent
      if (previous != null && previous != silent) {
        notify { it.mediaSessionSilentModeChanged(silent) }
      }
    }
  }

  fun addObserver(observer: MediaSessionObserver): ObserverRegistration {
    val id = nextId()
    task {
      observers.add(id to observer)
    }
    return ObserverRegistration {
      task {
        observers.removeAll { it.first == id }
      }
    }
  }

  fun clearTokenReference(id: Long) {
    task {
      entries.firstOrNull { it.id == id }?.token?.clear()
    }
  }

  fun post(body: () -> Unit) {
    task(body)
  }

  @VisibleForTesting
  fun close() {
    scope.launch {
      try {
        cancelRelease()
        if (currentFocus != null) {
          abandon()
        }
        completePending(
          Result.failure(
            MediaSessionException(
              "Audio focus was not requested because the media session manager shut down. " +
                "Begin a new use on a running manager"
            )
          )
        )
        publishSnapshot()
      } finally {
        scope.cancel()
      }
    }
  }

  private fun onFocusGained() {
    current = LossState.NONE
    if (focusDelayed) {
      focusDelayed = false
      activated = true
      if (suspendCount == 0) {
        completePending(Result.success(Unit))
        reconcile(client = null, activating = false, activation = null)
      }
    }
  }

  private fun onFocusLost() {
    val wasDelayed = focusDelayed
    if (suspendCount == 0) {
      abandon()
    } else {
      currentFocus = null
      focusDelayed = false
    }
    current = if (wasDelayed && reported == LossState.NONE) {
      LossState.NONE
    } else {
      LossState.PERMANENT
    }
    activated = false
    if (suspendCount == 0) {
      val client = entries.lastOrNull()?.client ?: "the session"
      completePending(
        Result.failure(
          MediaSessionException(
            "Audio focus for $client was lost before the system granted it. " +
              "Another app or a call took focus. Begin the use again after the other audio stops"
          )
        )
      )
    }
  }

  private fun publish() {
    if (suspendCount > 0) {
      return
    }
    if (entries.isEmpty() && current == LossState.PERMANENT) {
      current = LossState.NONE
    }
    if (current == reported) {
      return
    }
    when (reported) {
      LossState.DUCKED -> notify { it.mediaSessionDucked(false) }
      LossState.TRANSIENT -> {
        val shouldResume = current != LossState.PERMANENT && entries.isNotEmpty() &&
          (currentFocus != null || resolvedFocus() == null)
        notify { it.mediaSessionInterruptionEnded(shouldResume) }
      }
      else -> {}
    }
    reported = if (entries.isEmpty()) {
      LossState.NONE
    } else {
      current
    }
    when (reported) {
      LossState.DUCKED -> notify { it.mediaSessionDucked(true) }
      LossState.TRANSIENT, LossState.PERMANENT -> {
        notify { it.mediaSessionFocusLost(transient = reported == LossState.TRANSIENT) }
        notify { it.mediaSessionInterruptionBegan(InterruptionReason.DEFAULT) }
      }
      else -> {}
    }
  }

  private fun task(body: () -> Unit) = scope.launch {
    if (pruneCollectedTokens()) {
      if (entries.isEmpty()) {
        scheduleRelease()
      } else {
        reconcile(client = null, activating = false, activation = null)
      }
    }
    onTask()
    body()
    publish()
    publishSnapshot()
  }

  private fun publishSnapshot() {
    snapshot = Snapshot(entries.size, currentFocus, focusDelayed, pendingActivations.size)
  }

  private fun pruneCollectedTokens(): Boolean {
    val collected = entries.filter { it.token.get() == null }
    for (entry in collected) {
      log("${entry.client} did not end its session use before it was garbage collected")
      pendingActivations.remove(entry.activation)
      entry.activation.completeExceptionally(
        MediaSessionException(
          "The session use for ${entry.client} was garbage collected before it was activated. " +
            "Keep a reference to the use and close it when playback stops"
        )
      )
    }
    return entries.removeAll(collected)
  }

  private fun reconcile(client: String?, activating: Boolean, activation: CompletableDeferred<Unit>?) {
    activation?.let { pendingActivations.add(it) }
    val reportedClient = client ?: entries.lastOrNull()?.client
    if (suspendCount > 0 || reportedClient == null) {
      return
    }
    cancelRelease()

    val focus = resolvedFocus()
    if (focus == null) {
      if (currentFocus != null) {
        abandon()
      }
    } else if (focus != currentFocus && (activating || activated)) {
      try {
        val result = backend.requestFocus(focus)
        currentFocus = focus
        focusDelayed = result == FocusResult.DELAYED
        if (!focusDelayed) {
          current = LossState.NONE
        }
      } catch (e: Exception) {
        if (focusDelayed) {
          abandon()
        }
        val error = MediaSessionException(
          "Audio focus could not be acquired for $reportedClient. Another app or a phone call may hold focus " +
            "that does not allow others to play, or the app may be in the background without a foreground service, " +
            "where Android 15 and later refuse focus. Begin the use again after the other audio stops, or start " +
            "playback while the app is visible",
          e
        )
        completePending(Result.failure(error))
        notify { it.mediaSessionDidFail(error, reportedClient) }
        return
      }
    }
    if (focusDelayed) {
      return
    }
    if (activating) {
      activated = true
    }
    completePending(Result.success(Unit))
  }

  private fun resolvedFocus() = SessionResolver.resolve(policy, entries.map { it.requirements }).focus

  private fun completePending(result: Result<Unit>) {
    val waiting = pendingActivations.toList()
    pendingActivations.clear()
    waiting.forEach { deferred ->
      result.fold({ deferred.complete(Unit) }, { deferred.completeExceptionally(it) })
    }
  }

  private fun scheduleRelease() {
    if (suspendCount > 0) {
      return
    }
    if (currentFocus == null) {
      activated = false
      return
    }
    cancelRelease()
    val generation = releaseGeneration.get()
    releaseJob = scope.launch {
      delay(RELEASE_DELAY_MS)
      releaseJob = null
      pruneCollectedTokens()
      if (generation == releaseGeneration.get() && entries.isEmpty() && suspendCount == 0 && currentFocus != null) {
        abandon()
        activated = false
        publish()
      }
      publishSnapshot()
    }
  }

  private fun cancelRelease() {
    releaseJob?.cancel()
    releaseJob = null
  }

  private fun abandon() {
    backend.abandonFocus()
    currentFocus = null
    focusDelayed = false
    if (current != LossState.PERMANENT) {
      current = LossState.NONE
    }
  }

  fun notify(body: (MediaSessionObserver) -> Unit) {
    publishSnapshot()
    observers.toList().forEach { (_, observer) ->
      try {
        body(observer)
      } catch (e: Exception) {
        log("Observer failed: $e")
      }
    }
  }

  companion object {
    const val RELEASE_DELAY_MS = 1000L
    private const val TAG = "ExpoMediaSession"
  }
}
