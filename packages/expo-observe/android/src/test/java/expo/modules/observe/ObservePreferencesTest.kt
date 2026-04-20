package expo.modules.observe

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ObservePreferencesTest {
  private lateinit var context: Context

  @Before
  fun setUp() {
    context = ApplicationProvider.getApplicationContext()
    // Clear preferences before each test
    context
      .getSharedPreferences("dev.expo.eas.observe", Context.MODE_PRIVATE)
      .edit()
      .clear()
      .commit()
  }

  @Test
  fun `getEnabled returns true by default`() {
    assertTrue(ObservePreferences.getDispatchingEnabled(context))
  }

  @Test
  fun `setDispatchingEnabled false persists`() {
    ObservePreferences.setDispatchingEnabled(context, false)
    assertFalse(ObservePreferences.getDispatchingEnabled(context))
  }

  @Test
  fun `setDispatchingEnabled true after false persists`() {
    ObservePreferences.setDispatchingEnabled(context, false)
    assertFalse(ObservePreferences.getDispatchingEnabled(context))
    ObservePreferences.setDispatchingEnabled(context, true)
    assertTrue(ObservePreferences.getDispatchingEnabled(context))
  }

}
