package expo.modules.insights

import android.util.Log
import java.util.Collections

object Insights {
  private val events: MutableSet<String> = Collections.synchronizedSet(HashSet())
  fun send(event: String, at: Long = System.currentTimeMillis()) {
    Log.d("Insights", "$event at $at")
  }
  fun sendOnce(event: String, at: Long = System.currentTimeMillis()) {
    if (!events.contains(event)) {
      events.add(event)
      send(event, at)
    }
  }
}
