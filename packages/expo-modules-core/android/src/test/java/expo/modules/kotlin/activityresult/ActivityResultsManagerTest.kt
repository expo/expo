package expo.modules.kotlin.activityresult

import android.app.Activity
import androidx.activity.ComponentActivity
import androidx.appcompat.app.AppCompatActivity
import com.google.common.truth.Truth
import expo.modules.kotlin.hostactivity.HostActivity
import expo.modules.kotlin.providers.CurrentActivityProvider
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
@Suppress("DEPRECATION")
class ActivityResultsManagerTest {
  @Test
  fun `notifies host activity listeners for a ComponentActivity host`() {
    val activity = Robolectric.buildActivity(ComponentActivity::class.java).get()
    val manager = ActivityResultsManager(activityProvider(activity))
    var received: HostActivity? = null
    manager.addOnHostActivityAvailableListener { received = it }

    manager.onHostResume(HostActivity.from(activity))

    Truth.assertThat(received?.activity).isSameInstanceAs(activity)
  }

  @Test
  fun `notifies host activity listeners added after the host is available`() {
    val activity = Robolectric.buildActivity(ComponentActivity::class.java).get()
    val manager = ActivityResultsManager(activityProvider(activity))
    manager.onHostResume(HostActivity.from(activity))
    var received: HostActivity? = null

    manager.addOnHostActivityAvailableListener { received = it }

    Truth.assertThat(received?.activity).isSameInstanceAs(activity)
  }

  @Test
  fun `does not notify AppCompat listeners for a ComponentActivity host`() {
    val activity = Robolectric.buildActivity(ComponentActivity::class.java).get()
    val manager = ActivityResultsManager(activityProvider(activity))
    var appCompatListenerCalls = 0
    manager.addOnActivityAvailableListener { appCompatListenerCalls += 1 }

    manager.onHostResume(HostActivity.from(activity))

    Truth.assertThat(appCompatListenerCalls).isEqualTo(0)
  }

  @Test
  fun `notifies both listener kinds for an AppCompatActivity host`() {
    val activity = Robolectric.buildActivity(AppCompatActivity::class.java).get()
    val manager = ActivityResultsManager(activityProvider(activity))
    var receivedHost: HostActivity? = null
    var receivedAppCompat: AppCompatActivity? = null
    manager.addOnHostActivityAvailableListener { receivedHost = it }
    manager.addOnActivityAvailableListener { receivedAppCompat = it }

    manager.onHostResume(activity)

    Truth.assertThat(receivedHost?.activity).isSameInstanceAs(activity)
    Truth.assertThat(receivedAppCompat).isSameInstanceAs(activity)
  }

  @Test
  fun `does not dispatch a stale AppCompatActivity to a legacy listener after the host changes`() {
    val appCompatActivity = Robolectric.buildActivity(AppCompatActivity::class.java).get()
    val componentActivity = Robolectric.buildActivity(ComponentActivity::class.java).get()
    val manager = ActivityResultsManager(activityProvider(componentActivity))
    manager.onHostResume(appCompatActivity)
    manager.onHostResume(HostActivity.from(componentActivity))
    var received: AppCompatActivity? = null

    manager.addOnActivityAvailableListener { received = it }

    Truth.assertThat(received).isNull()
    // The old Activity stays strongly referenced for the whole test, like an Activity on the back stack.
    Truth.assertThat(appCompatActivity.isDestroyed).isFalse()
  }

  @Test
  fun `does not dispatch a destroyed host to a listener added after the destroy`() {
    val activity = Robolectric.buildActivity(ComponentActivity::class.java).get()
    val manager = ActivityResultsManager(activityProvider(activity))
    manager.onHostResume(HostActivity.from(activity))
    manager.onHostDestroy(HostActivity.from(activity))
    var receivedHost: HostActivity? = null
    var receivedAppCompat: AppCompatActivity? = null

    manager.addOnHostActivityAvailableListener { receivedHost = it }
    manager.addOnActivityAvailableListener { receivedAppCompat = it }

    Truth.assertThat(receivedHost).isNull()
    Truth.assertThat(receivedAppCompat).isNull()
  }

  private fun activityProvider(activity: Activity) = object : CurrentActivityProvider {
    override val currentActivity: Activity = activity
  }
}
