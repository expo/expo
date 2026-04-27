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
  fun `getConfig returns null by default`() {
    assertNull(ObservePreferences.getConfig(context))
  }

  @Test
  fun `setConfig with dispatchingEnabled false persists false`() {
    ObservePreferences.setConfig(context, PersistedConfig(dispatchingEnabled = false))
    assertEquals(false, ObservePreferences.getConfig(context)?.dispatchingEnabled)
  }

  @Test
  fun `setConfig overwrites previous value`() {
    ObservePreferences.setConfig(context, PersistedConfig(dispatchingEnabled = false))
    assertEquals(false, ObservePreferences.getConfig(context)?.dispatchingEnabled)
    ObservePreferences.setConfig(context, PersistedConfig(dispatchingEnabled = true))
    assertEquals(true, ObservePreferences.getConfig(context)?.dispatchingEnabled)
  }

  @Test
  fun `setConfig with null field clears previously set value`() {
    ObservePreferences.setConfig(context, PersistedConfig(dispatchingEnabled = false))
    assertEquals(false, ObservePreferences.getConfig(context)?.dispatchingEnabled)
    ObservePreferences.setConfig(context, PersistedConfig(dispatchingEnabled = null))
    assertNotNull(ObservePreferences.getConfig(context))
    assertNull(ObservePreferences.getConfig(context)?.dispatchingEnabled)
  }
}
