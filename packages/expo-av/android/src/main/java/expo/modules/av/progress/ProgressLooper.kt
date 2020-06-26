package expo.modules.av.progress

typealias TimeMachineTick = () -> Unit

interface TimeMachine {
  fun scheduleAt(intervalMillis: Long, callback: TimeMachineTick)
  val time: Long
}

typealias PlayerProgressListener = () -> Unit

class ProgressLooper(private val timeMachine: TimeMachine) {

  private var interval = 0L
  private var nextExpectedTick = -1L
  private var waiting = false

  private var shouldLoop: Boolean
    get() = interval > 0 && nextExpectedTick >= 0 && !waiting
    set(value) {
      if (!value) {
        interval = 0L
        nextExpectedTick = -1L
        waiting = false
      }
    }

  private var listener: PlayerProgressListener? = null

  fun setListener(listener: PlayerProgressListener) {
    this.listener = listener
  }

  fun loop(interval: Long, listener: PlayerProgressListener) {
    this.listener = listener
    this.interval = interval
    scheduleNextTick()
  }

  fun stopLooping() {
    this.shouldLoop = false
    this.listener = null
  }

  private fun scheduleNextTick() {
    if (nextExpectedTick == -1L) {
      nextExpectedTick = timeMachine.time
    }
    if (shouldLoop) {
      nextExpectedTick += calculateNextInterval()
      waiting = true
      timeMachine.scheduleAt(nextExpectedTick - timeMachine.time) {
        waiting = false
        listener?.invoke()
        scheduleNextTick()
      }
    }
  }

  private fun calculateNextInterval() =
    if (nextExpectedTick > timeMachine.time) {
      interval
    } else {
      (((timeMachine.time - nextExpectedTick) / interval) + 1) * interval
    }

}
