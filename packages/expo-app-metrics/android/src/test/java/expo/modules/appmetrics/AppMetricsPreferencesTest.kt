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
  fun `network traces configuration round-trips and defaults to disabled`() {
    assertEquals(
      expo.modules.appmetrics.networkrequests.NetworkTracesConfiguration(),
      AppMetricsPreferences.getNetworkTracesConfiguration(context)
    )
    val configured = expo.modules.appmetrics.networkrequests.NetworkTracesConfiguration(
      enabled = true,
      hosts = listOf("api.example.com")
    )
    AppMetricsPreferences.setNetworkTracesConfiguration(context, configured)
    assertEquals(configured, AppMetricsPreferences.getNetworkTracesConfiguration(context))
  }

  @Test
  fun `last processed exit timestamp defaults to zero`() {
    assertEquals(0L, AppMetricsPreferences.getLastProcessedExitTimestampMillis(context))
  }

  @Test
  fun `last processed exit timestamp round-trips`() {
    AppMetricsPreferences.setLastProcessedExitTimestampMillis(context, 1_700_000_000_500)
    assertEquals(1_700_000_000_500, AppMetricsPreferences.getLastProcessedExitTimestampMillis(context))
  }
}
