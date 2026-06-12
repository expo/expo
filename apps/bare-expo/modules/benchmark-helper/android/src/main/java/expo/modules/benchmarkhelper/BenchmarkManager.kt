package expo.modules.benchmarkhelper

import android.app.Activity
import androidx.appcompat.app.AppCompatActivity

object BenchmarkManager {
  fun delayFullDrawn(activity: AppCompatActivity) {
    activity.fullyDrawnReporter.addReporter()
  }

  fun reportFullyDrawn(activity: Activity?) {
    if (activity == null || activity !is AppCompatActivity) {
      return
    }

    activity.fullyDrawnReporter.removeReporter()
  }
}
