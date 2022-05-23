package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import com.google.common.truth.Truth.assertThat
import expo.modules.kotlin.activityresult.activities.ImmediateVoidResultActivity
import expo.modules.kotlin.providers.CurrentActivityProvider
import org.junit.Test
import org.junit.runner.RunWith

@LargeTest
@RunWith(AndroidJUnit4::class)
class ActivityResultsManagerTest {
  private var _currentActivity: AppCompatActivity? = null
  private val currentActivityProvider = object : CurrentActivityProvider {
    override val currentActivity: AppCompatActivity?
      get() = _currentActivity

  }
  private val activityResultsManager = ActivityResultsManager(currentActivityProvider)

  @Test
  fun registerCallback() {
    var launchCount = 0
    ActivityScenario.launch(AppCompatActivity::class.java)
      .use { scenario ->
        scenario.withActivity {
          _currentActivity = this
        }
        scenario.moveToState(Lifecycle.State.STARTED)
        scenario.withActivity {
          runOnUiThread {
            activityResultsManager.registerForActivityResult(StartActivityForResult()) { _, _ ->
              launchCount += 1
//            }.launch(Intent(_currentActivity, ImmediateVoidResultActivity::class.java))
            }.launch(Intent(_currentActivity, NoopActivity::class.java))
          }
        }
        assertThat(launchCount).isEqualTo(1)
      }
  }
}

open class NoopActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    finish()
  }
}

/**
 * Run [block] using [ActivityScenario.onActivity], returning the result of the block.
 */
inline fun <reified A : Activity, T : Any> ActivityScenarioRule<A>.withActivity(
  crossinline block: A.() -> T
): T = scenario.withActivity(block)
/**
 * Run [block] using [ActivityScenario.onActivity], returning the result of the block.
 */
inline fun <reified A : Activity, T : Any> ActivityScenario<A>.withActivity(
  crossinline block: A.() -> T
): T {
  lateinit var value: T
  var err: Throwable? = null
  onActivity { activity ->
    try {
      value = block(activity)
    } catch (t: Throwable) {
      err = t
    }
  }
  err?.let { throw it }
  return value
}
