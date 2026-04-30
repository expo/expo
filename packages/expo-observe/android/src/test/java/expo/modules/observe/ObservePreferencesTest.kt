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
      .getSharedPreferences("dev.expo.observe", Context.MODE_PRIVATE)
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

  @Test
  fun `getConfig sampleRate is null by default`() {
    assertNull(ObservePreferences.getConfig(context)?.sampleRate)
  }

  @Test
  fun `setConfig with sampleRate persists value`() {
    ObservePreferences.setConfig(context, PersistedConfig(sampleRate = 0.25))
    assertEquals(0.25, ObservePreferences.getConfig(context)?.sampleRate!!, 0.0001)
  }

  @Test
  fun `setConfig sampleRate 0_0 is distinct from null`() {
    ObservePreferences.setConfig(context, PersistedConfig(sampleRate = 0.0))
    assertEquals(0.0, ObservePreferences.getConfig(context)?.sampleRate!!, 0.0001)
  }

  @Test
  fun `setConfig sampleRate null clears previously set value`() {
    ObservePreferences.setConfig(context, PersistedConfig(sampleRate = 0.5))
    assertEquals(0.5, ObservePreferences.getConfig(context)?.sampleRate!!, 0.0001)
    ObservePreferences.setConfig(context, PersistedConfig(sampleRate = null))
    assertNull(ObservePreferences.getConfig(context)?.sampleRate)
  }

  // region PersistedBundleDefaults

  @Test
  fun `getBundleDefaults returns null by default`() {
    assertNull(ObservePreferences.getBundleDefaults(context))
  }

  @Test
  fun `setBundleDefaults persists environment and isJsDev`() {
    ObservePreferences.setBundleDefaults(
      context,
      PersistedBundleDefaults(environment = "development", isJsDev = true)
    )
    val defaults = ObservePreferences.getBundleDefaults(context)
    assertEquals("development", defaults?.environment)
    assertEquals(true, defaults?.isJsDev)
  }

  @Test
  fun `setBundleDefaults overwrites previous record`() {
    ObservePreferences.setBundleDefaults(
      context,
      PersistedBundleDefaults(environment = "development", isJsDev = true)
    )
    ObservePreferences.setBundleDefaults(
      context,
      PersistedBundleDefaults(environment = "production", isJsDev = false)
    )
    val defaults = ObservePreferences.getBundleDefaults(context)
    assertEquals("production", defaults?.environment)
    assertEquals(false, defaults?.isJsDev)
  }

  @Test
  fun `setBundleDefaults does not affect getConfig`() {
    ObservePreferences.setConfig(
      context,
      PersistedConfig(dispatchingEnabled = false, sampleRate = 0.5)
    )
    ObservePreferences.setBundleDefaults(
      context,
      PersistedBundleDefaults(environment = "production", isJsDev = false)
    )
    val config = ObservePreferences.getConfig(context)
    assertEquals(false, config?.dispatchingEnabled)
    assertEquals(0.5, config?.sampleRate!!, 0.0001)
  }

  @Test
  fun `setConfig does not affect getBundleDefaults`() {
    ObservePreferences.setBundleDefaults(
      context,
      PersistedBundleDefaults(environment = "development", isJsDev = true)
    )
    ObservePreferences.setConfig(context, PersistedConfig(dispatchingEnabled = true))
    val defaults = ObservePreferences.getBundleDefaults(context)
    assertEquals("development", defaults?.environment)
    assertEquals(true, defaults?.isJsDev)
  }

  // endregion
}
