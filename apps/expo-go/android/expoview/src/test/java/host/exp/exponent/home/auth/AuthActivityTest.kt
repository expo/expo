package host.exp.exponent.home.auth

import android.app.Activity
import android.content.Intent
import androidx.core.net.toUri
import host.exp.exponent.TestApplication
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = TestApplication::class)
class AuthActivityTest {
  @Test
  fun redirectWithoutAuthFlowCancelsInsteadOfCrashing() {
    val redirect = Intent(Intent.ACTION_VIEW, "expauth://auth?session_secret=secret".toUri())

    val activity = Robolectric.buildActivity(AuthActivity::class.java, redirect).setup().get()

    assertTrue(activity.isFinishing)
    assertEquals(Activity.RESULT_CANCELED, shadowOf(activity).resultCode)
  }
}
