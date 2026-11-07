package expo.modules.kotlin.exception

import androidx.activity.ComponentActivity
import androidx.fragment.app.FragmentActivity
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class UnsupportedHostActivityTest {
  @Test
  fun `names the requester, both classes, and the fix`() {
    val activity = Robolectric.buildActivity(ComponentActivity::class.java).get()

    val exception = Exceptions.UnsupportedHostActivity(
      activity,
      FragmentActivity::class.java,
      "The ExpoLocalAuthentication module"
    )

    Truth.assertThat(exception.code).isEqualTo("ERR_UNSUPPORTED_HOST_ACTIVITY")
    Truth.assertThat(exception.message).isEqualTo(
      "The ExpoLocalAuthentication module needs a host Activity that extends androidx.fragment.app.FragmentActivity. " +
        "The current Activity androidx.activity.ComponentActivity does not extend it. " +
        "Change the superclass of ComponentActivity to FragmentActivity or to one of its subclasses, such as AppCompatActivity."
    )
  }

  @Test
  fun `names the feature and says the other functions work for a feature-scoped requirement`() {
    val activity = Robolectric.buildActivity(ComponentActivity::class.java).get()

    val exception = Exceptions.UnsupportedHostActivity(
      activity,
      FragmentActivity::class.java,
      "The ExpoLocalAuthentication module",
      feature = "authentication prompts"
    )

    Truth.assertThat(exception.message).isEqualTo(
      "The ExpoLocalAuthentication module needs a host Activity that extends androidx.fragment.app.FragmentActivity " +
        "for authentication prompts. The current Activity androidx.activity.ComponentActivity does not extend it. " +
        "Its other functions work. To use authentication prompts, change the superclass of ComponentActivity to " +
        "FragmentActivity or to one of its subclasses, such as AppCompatActivity."
    )
  }
}
