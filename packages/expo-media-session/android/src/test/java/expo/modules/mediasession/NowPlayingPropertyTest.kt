package expo.modules.mediasession

import expo.modules.mediasession.FakeNowPlayingOwner.Event
import kotlin.random.Random
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.Assert.fail
import org.junit.Test

class NowPlayingPropertyTest {
  @Test
  fun nowPlayingStackKeepsItsInvariants() {
    val failures = (0 until SEEDS).mapNotNull { seed ->
      val run = NowPlayingRun(seed)
      try {
        run.play()?.let { "seed $seed: $it\n  steps: ${run.steps.joinToString(", ")}" }
      } finally {
        run.close()
      }
    }
    if (failures.isNotEmpty()) {
      fail("${failures.size} of $SEEDS seeds failed\n${failures.take(3).joinToString("\n")}")
    }
  }

  companion object {
    const val SEEDS = 1000
  }
}

private interface NowPlayingDriver {
  val ownerId: String?
  fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): Any
  fun update(claim: Any, info: NowPlayingInfo)
  fun withdraw(claim: Any)
  fun handle(command: RemoteCommand)
}

private class StackDriver(private val stack: NowPlayingStack) : NowPlayingDriver {
  override val ownerId get() = stack.ownerId

  override fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): Any =
    stack.offer(owner, info, commands)

  override fun update(claim: Any, info: NowPlayingInfo) = stack.update(claim as Long, info)

  override fun withdraw(claim: Any) = stack.withdraw(claim as Long)

  override fun handle(command: RemoteCommand) = stack.handle(command)
}

@OptIn(ExperimentalCoroutinesApi::class)
private class ClaimDriver(
  private val manager: MediaSessionManager,
  private val center: FakeNowPlayingCenter,
  private val scheduler: TestCoroutineScheduler
) : NowPlayingDriver {
  override val ownerId get() = manager.nowPlayingOwnerId

  override fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): Any =
    manager.offerNowPlaying(owner, info, commands).also { scheduler.runCurrent() }

  override fun update(claim: Any, info: NowPlayingInfo) {
    (claim as NowPlayingClaim).update(info)
    scheduler.runCurrent()
  }

  override fun withdraw(claim: Any) {
    (claim as NowPlayingClaim).withdraw()
    scheduler.runCurrent()
  }

  override fun handle(command: RemoteCommand) {
    center.send(command)
    scheduler.runCurrent()
  }
}

@OptIn(ExperimentalCoroutinesApi::class)
private class NowPlayingRun(seed: Int) {
  private class Live(
    val owner: Int,
    val claim: Any,
    var info: NowPlayingInfo,
    val commands: Set<RemoteCommandKind>,
    var wasPlaying: Boolean
  ) {
    var pausedByTakeover = false
  }

  private val random = Random(seed)
  private val center = FakeNowPlayingCenter()
  private val scheduler = TestCoroutineScheduler()
  private val throughClaims = seed % 4 >= 2
  private val manager = MediaSessionManager(
    FakeSessionBackend(),
    StandardTestDispatcher(scheduler),
    if (throughClaims) {
      center
    } else {
      DetachedNowPlayingCenter
    }
  ).apply {
    coordinator.log = {}
  }
  private val stack: NowPlayingDriver = if (throughClaims) {
    ClaimDriver(manager, center, scheduler)
  } else {
    StackDriver(NowPlayingStack(center, { manager.coordinator.effectiveInterruptionMode }))
  }
  private val hold = if (seed % 2 == 0) {
    manager.hold("property")
  } else {
    null
  }
  private val uses = mutableListOf<Pair<SessionUse, Boolean>>()
  private var policyMixes = false
  private val owners = (0 until 4).map {
    FakeNowPlayingOwner(
      "o$it",
      if (it % 2 == 0) {
        NowPlayingMediaType.AUDIO
      } else {
        NowPlayingMediaType.VIDEO
      }
    )
  }
  private val live = mutableListOf<Live>()
  private val stale = mutableListOf<Any>()
  private val seen = IntArray(4)
  private var offers = 0
  val steps = mutableListOf<String>()

  private val mixes: Boolean
    get() = policyMixes && uses.none { it.second }

  init {
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
    scheduler.runCurrent()
    owners[LATE_OWNER].pausesLate = true
  }

  fun close() {
    hold?.close()
    manager.coordinator.close()
  }

  private val top: Live?
    get() = live.lastOrNull()

  fun play(): String? {
    repeat(STEPS) {
      (step() ?: check())?.let { return it }
    }
    while (live.isNotEmpty()) {
      steps.add("end(o${live.last().owner})")
      (withdraw(live.size - 1) ?: check())?.let { return it }
    }
    return null
  }

  private fun step(): String? {
    val roll = random.nextInt(100)
    val index = random.nextInt(owners.size)
    val owner = owners[index]
    val current = live.indexOfFirst { it.owner == index }.takeIf { it >= 0 }
    when (roll) {
      in 0 until 25 -> {
        offers += 1
        val isPlaying = random.nextInt(3) > 0
        val info = NowPlayingInfo(title = "o$index#$offers", isLiveStream = random.nextBoolean())
        val commands = ALL_COMMANDS.filter { random.nextBoolean() }.toSet()
        steps.add("offer(o$index, ${if (isPlaying) "playing" else "paused"}, ${commands.size} commands)")
        owner.isPlaying = isPlaying
        val previous = top
        val topPlays = previous != null && previous.owner != index && owners[previous.owner].isPlaying
        val expected = mutableMapOf<Int, List<Event>>()
        if (isPlaying && topPlays && !mixes) {
          expected[previous!!.owner] = listOf(Event.PausedForTakeover)
          previous.pausedByTakeover = true
          previous.wasPlaying = true
        }
        current?.let { stale.add(live.removeAt(it).claim) }
        val claim = stack.offer(owner, info, commands)
        val entry = Live(index, claim, info, commands, isPlaying)
        if (!isPlaying && topPlays) {
          var position = live.size - 1
          while (position > 0 && live[position - 1].pausedByTakeover) {
            position -= 1
          }
          live.add(position, entry)
        } else {
          live.add(entry)
        }
        return expectEvents(expected)
      }
      in 25 until 35 -> {
        current ?: return null
        offers += 1
        steps.add("update(o$index)")
        live[current].info = NowPlayingInfo(title = "o$index#$offers")
        return update(current)
      }
      in 35 until 45 -> {
        current ?: return null
        steps.add("end(o$index)")
        return withdraw(current)
      }
      in 45 until 55 -> {
        current ?: return null
        steps.add("release(o$index)")
        return withdraw(current)
      }
      in 55 until 60 -> {
        if (stale.isEmpty()) {
          return null
        }
        steps.add("withdrawStale")
        stack.withdraw(stale.removeAt(random.nextInt(stale.size)))
      }
      in 60 until 68 -> {
        current ?: return null
        steps.add("userPause(o$index)")
        owner.isPlaying = false
        return update(current)
      }
      in 68 until 77 -> {
        current ?: return null
        steps.add("userPlay(o$index)")
        owner.isPlaying = true
        return update(current)
      }
      in 77 until 92 -> {
        val command = RemoteCommand(ALL_COMMANDS.random(random))
        steps.add("command(${command.kind.raw})")
        val before = owners.map { it.handledCount }
        stack.handle(command)
        val after = owners.map { it.handledCount }
        val expected = owners.indices.map {
          val top = top
          if (top != null && top.owner == it && command.kind in effective(top)) {
            before[it] + 1
          } else {
            before[it]
          }
        }
        if (after != expected) {
          return "the command ${command.kind.raw} reached $after handlers, expected $expected"
        }
      }
      in 92 until 96 -> {
        val strict = random.nextBoolean()
        steps.add(
          if (strict) {
            "beginUse(doNotMix)"
          } else {
            "beginUse"
          }
        )
        val requirements = SessionRequirements(
          mixing = if (strict) {
            MixingRequirement.DO_NOT_MIX
          } else {
            null
          }
        )
        uses.add(manager.beginUse("u", requirements) to strict)
        scheduler.runCurrent()
      }
      in 96 until 98 -> {
        if (uses.isEmpty()) {
          return null
        }
        steps.add("endUse")
        uses.removeAt(random.nextInt(uses.size)).first.end()
        scheduler.runCurrent()
      }
      else -> {
        policyMixes = random.nextBoolean()
        steps.add(
          if (policyMixes) {
            "policy(mix)"
          } else {
            "policy(doNotMix)"
          }
        )
        manager.setPolicy(
          AudioPolicyUpdate(
            interruptionMode = if (policyMixes) {
              InterruptionMode.MIX_WITH_OTHERS
            } else {
              InterruptionMode.DO_NOT_MIX
            }
          )
        )
        scheduler.runCurrent()
      }
    }
    return null
  }

  private fun update(index: Int): String? {
    val entry = live[index]
    val isPlaying = owners[entry.owner].isPlaying
    val startedPlaying = isPlaying && !entry.wasPlaying
    if (startedPlaying) {
      entry.pausedByTakeover = false
    }
    entry.wasPlaying = isPlaying
    val expected = mutableMapOf<Int, List<Event>>()
    if (startedPlaying && index != live.size - 1) {
      live.removeAt(index)
      val previous = top
      if (previous != null && owners[previous.owner].isPlaying && !mixes) {
        expected[previous.owner] = listOf(Event.PausedForTakeover)
        previous.pausedByTakeover = true
        previous.wasPlaying = true
      }
      live.add(entry)
    }
    stack.update(entry.claim, entry.info)
    return expectEvents(expected)
  }

  private fun withdraw(index: Int): String? {
    val wasTop = index == live.size - 1
    val entry = live.removeAt(index)
    val expected = mutableMapOf<Int, List<Event>>()
    val top = top
    if (wasTop && top != null && top.pausedByTakeover) {
      expected[top.owner] = listOf(Event.ResumedAfterTakeover)
      top.pausedByTakeover = false
    }
    stack.withdraw(entry.claim)
    return expectEvents(expected)
  }

  private fun newEvents(index: Int): List<Event> {
    val events = owners[index].events
    return events.drop(seen[index]).also { seen[index] = events.size }
  }

  private fun expectEvents(expected: Map<Int, List<Event>>): String? {
    for (index in owners.indices) {
      val new = newEvents(index).filter { it !is Event.Handled }
      val wanted = expected[index] ?: emptyList()
      if (new != wanted) {
        return "o$index got $new, expected $wanted (mix: $mixes)"
      }
    }
    return null
  }

  private fun check(): String? {
    for (index in owners.indices) {
      val new = newEvents(index).filter { it !is Event.Handled }
      if (new.isNotEmpty()) {
        return "o$index got $new outside a takeover or a return"
      }
    }
    val top = top
    if (top == null) {
      return if (center.state != null || center.targets.isNotEmpty() || stack.ownerId != null) {
        "the stack is empty but the center still shows ${center.state?.info?.title}"
      } else {
        null
      }
    }
    if (stack.ownerId != "o${top.owner}") {
      return "the top is ${stack.ownerId}, expected o${top.owner}"
    }
    if (center.state?.info != top.info || center.targets != effective(top)) {
      return "the center shows ${center.state?.info?.title}, expected ${top.info.title}"
    }
    if (center.state?.mediaType != owners[top.owner].mediaType) {
      return "the center media type does not follow o${top.owner}"
    }
    return null
  }

  private fun effective(entry: Live) =
    if (entry.info.isLiveStream) {
      entry.commands - RemoteCommandKind.SEEK
    } else {
      entry.commands
    }

  companion object {
    const val STEPS = 40
    const val LATE_OWNER = 3
    val ALL_COMMANDS = listOf(
      RemoteCommandKind.PLAY,
      RemoteCommandKind.PAUSE,
      RemoteCommandKind.TOGGLE_PLAY_PAUSE,
      RemoteCommandKind.SEEK,
      RemoteCommandKind.SKIP_FORWARD,
      RemoteCommandKind.NEXT_TRACK
    )
  }
}
