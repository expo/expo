package expo.modules.kotlin.hostactivity

import android.app.Activity
import androidx.activity.ComponentActivity
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.FragmentActivity
import com.google.common.truth.Truth
import expo.modules.kotlin.exception.Exceptions
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class HostActivityTest {
  @Test
  fun `wraps an AppCompatActivity as a FragmentHostActivity`() {
    val activity = Robolectric.buildActivity(AppCompatActivity::class.java).get()

    val hostActivity = HostActivity.from(activity)

    Truth.assertThat(hostActivity).isInstanceOf(FragmentHostActivity::class.java)
    Truth.assertThat(hostActivity.activity).isSameInstanceAs(activity)
    Truth.assertThat(hostActivity.fragmentManager).isSameInstanceAs(activity.supportFragmentManager)
  }

  @Test
  fun `wraps a FragmentActivity as a FragmentHostActivity`() {
    val activity = Robolectric.buildActivity(FragmentActivity::class.java).get()

    val hostActivity = HostActivity.from(activity)

    Truth.assertThat(hostActivity).isInstanceOf(FragmentHostActivity::class.java)
    Truth.assertThat(hostActivity.fragmentManager).isSameInstanceAs(activity.supportFragmentManager)
    Truth.assertThat(hostActivity.lifecycleOwner).isSameInstanceAs(activity)
  }

  @Test
  fun `wraps a ComponentActivity as a ComponentHostActivity without a fragment manager`() {
    val activity = Robolectric.buildActivity(ComponentActivity::class.java).get()

    val hostActivity = HostActivity.from(activity)

    Truth.assertThat(hostActivity).isInstanceOf(ComponentHostActivity::class.java)
    Truth.assertThat(hostActivity.activity).isSameInstanceAs(activity)
    Truth.assertThat(hostActivity.fragmentManager).isNull()
    Truth.assertThat(hostActivity.lifecycleOwner).isSameInstanceAs(activity)
    Truth.assertThat(hostActivity.onBackPressedDispatcher).isSameInstanceAs(activity.onBackPressedDispatcher)
  }

  @Test
  fun `rejects an Activity that does not extend ComponentActivity`() {
    val activity = Robolectric.buildActivity(Activity::class.java).get()

    Truth.assertThat(HostActivity.fromOrNull(activity)).isNull()

    val exception = assertThrows(Exceptions.UnsupportedHostActivity::class.java) {
      HostActivity.from(activity)
    }
    Truth.assertThat(exception.code).isEqualTo("ERR_UNSUPPORTED_HOST_ACTIVITY")
    Truth.assertThat(exception.message).contains(ComponentActivity::class.java.name)
    Truth.assertThat(exception.message).contains(Activity::class.java.name)
  }
}
