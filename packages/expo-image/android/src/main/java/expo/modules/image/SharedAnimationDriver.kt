package expo.modules.image

import android.os.SystemClock
import com.github.penfeizhou.animation.FrameAnimationDrawable
import com.github.penfeizhou.animation.decode.FrameSeqDecoder
import java.lang.ref.WeakReference
import java.nio.ByteBuffer

/**
 * Keeps every [FrameAnimationDrawable] of the same image in step.
 *
 * Glide skips the memory cache with the default cache policy, so each view has its own [FrameSeqDecoder]
 * and the animations drift apart. Drawables are grouped by an image key and the one playing the longest is
 * the 'leader'. After rendering a frame, a 'follower' compares itself with the leader: if it is behind it renders the next frame right away, if it is ahead it pauses on its frame until the leader gets there.
 * Decoders call back on their worker threads, so every entry point is synchronized.
 */
internal object SharedAnimationDriver {
  private class Member(drawable: FrameAnimationDrawable<*>) : FrameSeqDecoder.RenderListener {
    private val drawableRef = WeakReference(drawable)

    val drawable: FrameAnimationDrawable<*>?
      get() = drawableRef.get()

    val decoder: FrameSeqDecoder<*, *>?
      get() = drawable?.frameSeqDecoder

    val isPlaying: Boolean
      get() = drawable?.let { it.isRunning && !it.isPaused } ?: false

    var playingSince: Long = SystemClock.uptimeMillis()

    // Frame the member paused on while it waits for the leader, or -1.
    var waitingOnFrame: Int = -1

    override fun onStart() = Unit

    override fun onRender(byteBuffer: ByteBuffer?) = onFrameRendered(this)

    override fun onEnd() = Unit
  }

  private val groups = HashMap<String, MutableList<Member>>()

  // Puts the drawable into the group of the image identified by [key].
  @Synchronized
  fun onAnimatableDisplayed(drawable: FrameAnimationDrawable<*>, key: String) {
    val existing = findMember(drawable)
    if (existing != null && existing.first == key) {
      existing.second.playingSince = SystemClock.uptimeMillis()
      return
    }
    if (existing != null) {
      remove(existing.first, existing.second)
    }

    val member = Member(drawable)
    groups.getOrPut(key) { mutableListOf() }.add(member)
    drawable.frameSeqDecoder.addRenderListener(member)
  }

  // A resumed drawable is out of phase, so it must not lead until it has caught up.
  @Synchronized
  fun onAnimatableResumed(drawable: FrameAnimationDrawable<*>) {
    findMember(drawable)?.second?.apply {
      playingSince = SystemClock.uptimeMillis()
      waitingOnFrame = -1
    }
  }

  @Synchronized
  fun onAnimatableReleased(drawable: FrameAnimationDrawable<*>) {
    findMember(drawable)?.let { (key, member) -> remove(key, member) }
  }

  @Synchronized
  private fun onFrameRendered(member: Member) {
    val (key, members) = groups.entries.firstOrNull { it.value.contains(member) } ?: return
    prune(key, members)

    val decoder = member.decoder ?: return
    val leader = members.filter { it.isPlaying }.minByOrNull { it.playingSince } ?: return
    if (leader === member) {
      resumeFollowers(members, leader, decoder.frameIndex, decoder.frameCount)
    } else {
      alignWithLeader(member, decoder, leader)
    }
  }

  // Runs on the follower's worker thread, so pausing here cancels the render it has just scheduled.
  private fun alignWithLeader(member: Member, decoder: FrameSeqDecoder<*, *>, leader: Member) {
    val leaderDecoder = leader.decoder ?: return
    val frameCount = decoder.frameCount
    if (frameCount <= 1 || leaderDecoder.frameCount != frameCount) {
      return
    }
    val distance = Math.floorMod(leaderDecoder.frameIndex - decoder.frameIndex, frameCount)
    when {
      distance == 0 -> Unit
      distance <= frameCount / 2 -> {
        decoder.pause()
        decoder.resume()
      }
      else -> {
        decoder.pause()
        member.waitingOnFrame = decoder.frameIndex
      }
    }
  }

  private fun resumeFollowers(members: List<Member>, leader: Member, leaderFrame: Int, frameCount: Int) {
    if (frameCount <= 1) {
      return
    }
    for (other in members) {
      if (other === leader || other.waitingOnFrame < 0) {
        continue
      }
      // Resuming renders the next frame, so wait until the leader has reached it.
      val distance = Math.floorMod(leaderFrame - (other.waitingOnFrame + 1), frameCount)
      if (distance <= frameCount / 2) {
        other.waitingOnFrame = -1
        other.decoder?.resume()
      }
    }
  }

  private fun findMember(drawable: FrameAnimationDrawable<*>): Pair<String, Member>? {
    for ((key, members) in groups) {
      val member = members.firstOrNull { it.drawable === drawable } ?: continue
      return key to member
    }
    return null
  }

  private fun remove(key: String, member: Member) {
    member.decoder?.removeRenderListener(member)
    if (member.waitingOnFrame >= 0) {
      member.decoder?.resume()
    }
    val members = groups[key] ?: return
    members.remove(member)
    if (members.isEmpty()) {
      groups.remove(key)
    } else if (members.none { it.isPlaying }) {
      // Nobody is left to resume the waiting members.
      members.filter { it.waitingOnFrame >= 0 }.forEach {
        it.waitingOnFrame = -1
        it.decoder?.resume()
      }
    }
  }

  // Drops members whose drawable was garbage collected.
  private fun prune(key: String, members: MutableList<Member>) {
    members.removeAll { it.drawable == null }
    if (members.isEmpty()) {
      groups.remove(key)
    }
  }
}
