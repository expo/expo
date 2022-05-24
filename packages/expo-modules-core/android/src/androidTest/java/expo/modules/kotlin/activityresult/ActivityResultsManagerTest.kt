package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.appcompat.app.AppCompatActivity
import androidx.core.os.bundleOf
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import com.google.common.truth.Truth.assertThat
import expo.modules.kotlin.providers.CurrentActivityProvider
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private val currentActivityProvider = object : CurrentActivityProvider {
  var activity: AppCompatActivity? = null

  override val currentActivity: AppCompatActivity?
    get() = activity
}
private val activityResultsManager = ActivityResultsManager(currentActivityProvider)

@LargeTest
@RunWith(AndroidJUnit4::class)
class ActivityResultsManagerTest {
  @Test
  fun registerCallbackAndWaitForResult() {
    var launchCount = 0
    ActivityScenario.launch(SignalingActivity::class.java)
      .use { scenario ->
        scenario.moveToState(Lifecycle.State.STARTED)
        scenario.withActivity {
          activityResultsManager.registerForActivityResult(StartActivityForResult()) { _, _ ->
            launchCount += 1
          }.launch(Intent(this, DelayedBundleResultActivity::class.java))
        }
        scenario.withActivity { assertThat(launchCount).isEqualTo(1) }
      }
  }

  @Test
  fun registerCallbackAndCheckActivityIsNotDestroyed() {
    var launchingActivityDestroyed: Boolean? = null
    ActivityScenario.launch(SignalingActivity::class.java)
      .use { scenario ->
        scenario.withActivity {
          activityResultsManager.registerForActivityResult(StartActivityForResult()) { _, activityDestroyed ->
            launchingActivityDestroyed = activityDestroyed
          }.launch(Intent(this, DelayedBundleResultActivity::class.java))
        }
        scenario.withActivity {
          assertThat(launchingActivityDestroyed).isFalse()
        }
      }
  }

  @Test
  fun registerCallbackAndCheckActivityIsDestroyed() {
    var launchingActivityDestroyed: Boolean? = null
    ActivityScenario.launch(RecreatedSignalingActivity::class.java)
      .use { scenario ->
        scenario.withActivity {
          activityResultsManager.registerForActivityResult(StartActivityForResult()) { _, activityDestroyed ->
            launchingActivityDestroyed = activityDestroyed
          }.launch(Intent(this, DelayedBundleResultActivity::class.java))
        }
        scenario.recreate()
        scenario.withActivity {
          assertThat(launchingActivityDestroyed).isTrue()
        }
      }
  }
}

open class SignalingActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    currentActivityProvider.activity = this
  }

  override fun startActivityForResult(intent: Intent?, requestCode: Int, options: Bundle?) {
    super.startActivityForResult(intent, requestCode, options)
    // TODO (@bbarthec): `onActivityResult` is not triggered for some unknown reason
    onActivityResult(requestCode, Activity.RESULT_OK, null)
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    activityResultsManager.onActivityResult(this, requestCode, resultCode, data)
    super.onActivityResult(requestCode, resultCode, data)
  }
}

open class RecreatedSignalingActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    currentActivityProvider.activity = this
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    activityResultsManager.onActivityResult(this, requestCode, resultCode, data)
    super.onActivityResult(requestCode, resultCode, data)
  }
}

open class DelayedBundleResultActivity : Activity() {
  private val threadExecutor = Executors.newSingleThreadScheduledExecutor()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    threadExecutor.schedule({
      setResult(RESULT_OK, Intent().apply { putExtra("data", bundleOf("key" to "value")) })
      finish()
    }, 1, TimeUnit.SECONDS)
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
