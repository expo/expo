package expo.modules.av.progress

import android.os.Handler

class AndroidLooperTimeMachine : TimeMachine {

  override fun scheduleAt(intervalMillis: Long, callback: TimeMachineTick) {
    Handler().postDelayed(callback, intervalMillis)
  }

  override val time: Long
    get() = System.currentTimeMillis()
}
