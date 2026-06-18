package expo.modules.appmetrics.storage

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.GlobalAttributes
import expo.modules.appmetrics.utils.JsonAny
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SessionManagerGlobalAttributesTest {
  private lateinit var database: MetricsDatabase
  private lateinit var sessionManager: SessionManager
  private val sessionId = "session-1"

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    sessionManager = SessionManager(context, database)
    GlobalAttributes.set(null)
  }

  @After
  fun tearDown() {
    database.close()
    GlobalAttributes.set(null)
  }

  @Test
  fun `addMetrics passes params through unchanged when globals are empty`() = runTest {
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addMetrics(
      listOf(metric(params = mapOf("screen" to "home"))),
      sessionId
    )
    val stored = readMetricParams()
    assertEquals(1, stored.size)
    assertEquals("home", stored["screen"])
  }

  @Test
  fun `addMetrics merges globals into params`() = runTest {
    GlobalAttributes.set(mapOf("subscription_tier" to "pro", "experiment_variant" to "B"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addMetrics(
      listOf(metric(params = mapOf("screen" to "home"))),
      sessionId
    )
    val stored = readMetricParams()
    assertEquals(3, stored.size)
    assertEquals("home", stored["screen"])
    assertEquals("pro", stored["subscription_tier"])
    assertEquals("B", stored["experiment_variant"])
  }

  @Test
  fun `addMetrics per-metric params win on key collision`() = runTest {
    GlobalAttributes.set(mapOf("screen" to "global_default"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addMetrics(
      listOf(metric(params = mapOf("screen" to "checkout"))),
      sessionId
    )
    val stored = readMetricParams()
    assertEquals(1, stored.size)
    assertEquals("checkout", stored["screen"])
  }

  @Test
  fun `addMetrics writes globals into a metric without its own params`() = runTest {
    GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addMetrics(listOf(metric(params = null)), sessionId)
    val stored = readMetricParams()
    assertEquals(1, stored.size)
    assertEquals("pro", stored["subscription_tier"])
  }

  @Test
  fun `addMetrics keeps null params null when globals are empty`() = runTest {
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addMetrics(listOf(metric(params = null)), sessionId)
    val stored = sessionManager.getSessionById(sessionId)?.metrics ?: emptyList()
    assertEquals(1, stored.size)
    assertNull(stored[0].params)
  }

  @Test
  fun `addLogs merges globals into attributes`() = runTest {
    GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addLogs(
      listOf(log(attributes = mapOf("userId" to "u_42"))),
      sessionId
    )
    val stored = readLogAttributes()
    assertEquals(2, stored.size)
    assertEquals("u_42", stored["userId"])
    assertEquals("pro", stored["subscription_tier"])
  }

  @Test
  fun `addLogs per-event attributes win on key collision`() = runTest {
    GlobalAttributes.set(mapOf("screen" to "global"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addLogs(
      listOf(log(attributes = mapOf("screen" to "checkout"))),
      sessionId
    )
    val stored = readLogAttributes()
    assertEquals(1, stored.size)
    assertEquals("checkout", stored["screen"])
  }

  @Test
  fun `addLogs keeps null attributes null when globals are empty`() = runTest {
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addLogs(listOf(log(attributes = null)), sessionId)
    val stored = sessionManager.getSessionById(sessionId)?.logs ?: emptyList()
    assertEquals(1, stored.size)
    assertNull(stored[0].attributes)
  }

  @Test
  fun `addLogs writes globals into a log without attributes`() = runTest {
    GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addLogs(listOf(log(attributes = null)), sessionId)
    val stored = readLogAttributes()
    assertEquals(1, stored.size)
    assertEquals("pro", stored["subscription_tier"])
  }

  @Test
  fun `addMetrics preserves unparseable params verbatim`() = runTest {
    GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addMetrics(listOf(metric(rawParams = "not json")), sessionId)
    val stored = sessionManager.getSessionById(sessionId)?.metrics ?: emptyList()
    assertEquals(1, stored.size)
    assertEquals("not json", stored[0].params)
  }

  @Test
  fun `addLogs preserves unparseable attributes verbatim`() = runTest {
    GlobalAttributes.set(mapOf("subscription_tier" to "pro"))
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addLogs(listOf(log(rawAttributes = "not json")), sessionId)
    val stored = sessionManager.getSessionById(sessionId)?.logs ?: emptyList()
    assertEquals(1, stored.size)
    assertEquals("not json", stored[0].attributes)
  }

  private suspend fun readMetricParams(): Map<String, Any?> {
    val rows = sessionManager.getSessionById(sessionId)?.metrics ?: emptyList()
    assertEquals(1, rows.size)
    val json = rows[0].params
    assertNotNull(json)
    return JsonAny.decodeJsonStringToMap(json!!)!!
  }

  private suspend fun readLogAttributes(): Map<String, Any?> {
    val rows = sessionManager.getSessionById(sessionId)?.logs ?: emptyList()
    assertEquals(1, rows.size)
    val json = rows[0].attributes
    assertNotNull(json)
    return JsonAny.decodeJsonStringToMap(json!!)!!
  }

  private fun metric(
    metricId: String = "m-1",
    name: String = "test-metric",
    params: Map<String, Any?>? = null,
    rawParams: String? = null
  ): MetricInput =
    MetricInput(
      metricId = metricId,
      timestamp = "2025-01-01T00:00:00.000Z",
      category = "test",
      name = name,
      value = 1.0,
      params = rawParams ?: params?.let { JsonAny.encodeMapToJsonString(it) }
    )

  private fun log(
    logId: String = "l-1",
    name: String = "test.event",
    attributes: Map<String, Any?>? = null,
    rawAttributes: String? = null
  ): LogRecord =
    LogRecord(
      logId = logId,
      sessionId = "",
      timestamp = "2025-01-01T00:00:00.000Z",
      name = name,
      severity = "info",
      attributes = rawAttributes ?: attributes?.let { JsonAny.encodeMapToJsonString(it) }
    )
}
