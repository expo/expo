package expo.modules.appmetrics

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
class AppMetricsPreferencesTest {
  private lateinit var context: Context

  @Before
  fun setUp() {
    context = ApplicationProvider.getApplicationContext()
    context
      .getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE)
      .edit()
      .clear()
      .commit()
  }

  @Test
  fun `getEnvironment returns default environment when nothing saved`() {
    // Robolectric apps are debuggable by default
    assertEquals("development", AppMetricsPreferences.getEnvironment(context))
  }

  @Test
  fun `getEnvironment returns saved environment over default`() {
    AppMetricsPreferences.setEnvironment(context, "production")
    assertEquals("production", AppMetricsPreferences.getEnvironment(context))
  }

  @Test
  fun `setEnvironment persists value`() {
    AppMetricsPreferences.setEnvironment(context, "staging")
    assertEquals("staging", AppMetricsPreferences.getEnvironment(context))
  }

  @Test
  fun `getDefaultEnvironment returns development in debug builds`() {
    // testDebugUnitTest has BuildConfig.DEBUG = true
    assertEquals("development", AppMetricsPreferences.getDefaultEnvironment())
  }
}
