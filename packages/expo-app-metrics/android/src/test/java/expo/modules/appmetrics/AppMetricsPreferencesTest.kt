package expo.modules.appmetrics

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.networkrequests.NetworkTracesConfiguration
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkAll
import org.junit.After
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

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `setters save nothing while consent is not granted and the values stay in memory`() {
    mockkObject(ObserveConsent)
    every { ObserveConsent.isGranted } returns false
    val configured = NetworkTracesConfiguration(enabled = true, hosts = listOf("api.example.com"))

    AppMetricsPreferences.setEnvironment(context, "staging")
    AppMetricsPreferences.setLastProcessedExitTimestampMillis(context, 5)
    AppMetricsPreferences.setNetworkTracesConfiguration(context, configured)

    assertEquals("staging", AppMetricsPreferences.getEnvironment(context))
    assertEquals(5L, AppMetricsPreferences.getLastProcessedExitTimestampMillis(context))
    assertEquals(configured, AppMetricsPreferences.getNetworkTracesConfiguration(context))
    assertTrue(context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).all.isEmpty())
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
  fun `getEnvironment returns default environment when nothing saved`() {
    val expected = if (BuildConfig.DEBUG) {
      "development"
    } else {
      null
    }
    assertEquals(expected, AppMetricsPreferences.getEnvironment(context))
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
  fun `getDefaultEnvironment matches build variant`() {
    val expected = if (BuildConfig.DEBUG) {
      "development"
    } else {
      null
    }
    assertEquals(expected, AppMetricsPreferences.getDefaultEnvironment())
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
