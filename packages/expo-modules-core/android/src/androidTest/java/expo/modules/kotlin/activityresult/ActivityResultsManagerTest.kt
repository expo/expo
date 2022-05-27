package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.appcompat.app.AppCompatActivity
import androidx.core.os.bundleOf
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import com.google.common.truth.Truth.assertThat
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.providers.CurrentActivityProvider
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private val currentActivityProvider = object : CurrentActivityProvider {
  var activity: ComponentActivity? = null

  override val currentActivity: ComponentActivity?
    get() = activity
}
private val activityResultsManager = ActivityResultsManager(currentActivityProvider)

@LargeTest
@RunWith(AndroidJUnit4::class)
class ActivityResultsManagerTest {
  @Test
  fun registerCallbackAndEnsureItLaunches() {
    var launchCount = 0
    ActivityScenario.launch(ReportingActivity::class.java)
      .use { scenario ->
        scenario.moveToState(Lifecycle.State.STARTED)
        scenario.withActivity {
          activityResultsManager.registerForActivityResult(StartActivityForResult()) { _, _ ->
            launchCount += 1
          }.launch(Intent(this, DelayedBundleResultActivity::class.java))
        }
        scenario.moveToState(Lifecycle.State.RESUMED)
        scenario.withActivity {
          assertThat(launchCount).isEqualTo(1)
        }
      }
  }

  @Test
  fun registerCallbackAndEnsureActivityIsNotDestroyed() {
    var launchingActivityDestroyed: Boolean? = null
    ActivityScenario.launch(ReportingActivity::class.java)
      .use { scenario ->
        scenario.moveToState(Lifecycle.State.STARTED)
        scenario.withActivity {
          activityResultsManager.registerForActivityResult(StartActivityForResult()) { _, activityDestroyed ->
            launchingActivityDestroyed = activityDestroyed
          }.launch(Intent(this, DelayedBundleResultActivity::class.java))
        }
        scenario.moveToState(Lifecycle.State.RESUMED)
        scenario.withActivity {
          assertThat(launchingActivityDestroyed).isFalse()
        }
      }
  }

  @Test
  fun registerCallbackAndEnsurePayloadIsReturned() {
    var returnedBundle: Bundle? = null
    ActivityScenario.launch(ReportingActivity::class.java)
      .use { scenario ->
        scenario.withActivity {
          activityResultsManager.registerForActivityResult(StartActivityForResult()) { result, _ ->
            returnedBundle = result.data?.extras?.getBundle("data")
          }.launch(Intent(this, DelayedBundleResultActivity::class.java))
        }
        scenario.moveToState(Lifecycle.State.RESUMED)
        scenario.withActivity {
          assertThat(returnedBundle?.getString("key")).isEqualTo("value")
        }
      }
  }

  @Test
  fun registerCallbackAndRecreateActivityAndEnsureActivityIsDestroyed() {
    var launchingActivityDestroyed: Boolean? = null
    ActivityScenario.launch(RecreatedActivity::class.java)
      .use { scenario ->
        scenario.moveToState(Lifecycle.State.STARTED)
        scenario.withActivity {
          activityResultsManager.registerForActivityResult(StartActivityForResult()) { _, activityDestroyed ->
            launchingActivityDestroyed = activityDestroyed
          }.launch(Intent(this, DelayedBundleResultActivity::class.java))
        }
        scenario.recreate()
        scenario.withActivity {
          assertThat(launchingActivityDestroyed).isEqualTo(true)
        }
      }
  }
}

/**
 * This Activity register itself in [currentActivityProvider] and [activityResultsManager]
 */
open class ReportingActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    currentActivityProvider.activity = this
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    activityResultsManager.onActivityResult(this, requestCode, resultCode, data)
    super.onActivityResult(requestCode, resultCode, data)
  }
}

/**
 * This Activity imitates the process happening in Android when the OS is low on resources and kills
 * backgrounded Activities.
 */
class RecreatedActivity : ReportingActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    if (savedInstanceState != null) {
      rememberedRequestCode?.let { onActivityResult(it, RESULT_OK, null) }
    }
    super.onCreate(savedInstanceState)
  }

  /**
   * Intentionally do not start other Activity here and only save request code
   */
  override fun startActivityForResult(intent: Intent?, requestCode: Int, options: Bundle?) {
    rememberedRequestCode = requestCode
  }

  companion object {
    var rememberedRequestCode: Int? = null
  }
}


class DelayedBundleResultActivity : ComponentActivity() {
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
