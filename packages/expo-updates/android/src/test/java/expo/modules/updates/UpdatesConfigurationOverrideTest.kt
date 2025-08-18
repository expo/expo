package expo.modules.updates

import android.content.Context
import android.content.SharedPreferences
import androidx.core.net.toUri
import com.google.common.truth.Truth
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.json.JSONObject
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class UpdatesConfigurationOverrideTest {
  private lateinit var mockContext: Context
  private lateinit var mockPrefs: SharedPreferences
  private lateinit var mockEditor: SharedPreferences.Editor

  @Before
  fun setup() {
    clearAllMocks()
    mockContext = mockk()
    mockPrefs = mockk()
    mockEditor = mockk(relaxed = true)
    every { mockContext.getSharedPreferences(any(), any()) } returns mockPrefs
    every { mockPrefs.edit() } returns mockEditor
  }

  @Test
  fun `constructor should create instance with provided values`() {
    val updateUrl = "https://example.com/manifest".toUri()
    val requestHeaders = mapOf("Authorization" to "Bearer token", "User-Agent" to "ExpoApp")

    val override = UpdatesConfigurationOverride(updateUrl, requestHeaders)

    Truth.assertThat(override.updateUrl).isEqualTo(updateUrl)
    Truth.assertThat(override.requestHeaders).isEqualTo(requestHeaders)
  }

  @Test
  fun `constructor should create instance with null values`() {
    val override = UpdatesConfigurationOverride(null, null)

    Truth.assertThat(override.updateUrl).isNull()
    Truth.assertThat(override.requestHeaders).isNull()
  }

  @Test
  fun `load should return null when no stored configuration exists`() {
    every { mockPrefs.getString(any(), any()) } returns null

    val result = UpdatesConfigurationOverride.load(mockContext)

    Truth.assertThat(result).isNull()
  }

  @Test
  fun `load should return configuration when stored configuration exists`() {
    val jsonString = """{"updateUrl":"https://example.com/manifest","requestHeaders":{"Authorization":"Bearer token"}}"""
    every { mockPrefs.getString(any(), any()) } returns jsonString

    val result = UpdatesConfigurationOverride.load(mockContext)

    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result?.updateUrl).isEqualTo("https://example.com/manifest".toUri())
    Truth.assertThat(result?.requestHeaders).isEqualTo(mapOf("Authorization" to "Bearer token"))
  }

  @Test
  fun `load should return configuration from partial stored configurations`() {
    val jsonString = """{"requestHeaders":{"Authorization":"Bearer token"}}"""
    every { mockPrefs.getString(any(), any()) } returns jsonString

    val result = UpdatesConfigurationOverride.load(mockContext)

    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result?.updateUrl).isNull()
    Truth.assertThat(result?.requestHeaders).isEqualTo(mapOf("Authorization" to "Bearer token"))
  }

  @Test
  fun `save should store configuration when override is not null`() {
    val updateUrl = "https://example.com/manifest".toUri()
    val requestHeaders = mapOf("Authorization" to "Bearer token")
    val override = UpdatesConfigurationOverride(updateUrl, requestHeaders)
    val stringSlot = slot<String>()

    UpdatesConfigurationOverride.save(mockContext, override)

    verify { mockEditor.putString(any(), capture(stringSlot)) }
    val storedJson = JSONObject(stringSlot.captured)
    Truth.assertThat(storedJson.getString("updateUrl")).isEqualTo("https://example.com/manifest")
    Truth.assertThat(storedJson.getJSONObject("requestHeaders").getString("Authorization")).isEqualTo("Bearer token")
  }

  @Test
  fun `save should remove configuration when override is null`() {
    UpdatesConfigurationOverride.save(mockContext, configOverride = null)

    verify { mockEditor.remove(any()) }
  }

  @Test
  fun `saveRequestHeaders should create new override when none exists`() {
    val requestHeaders = mapOf("Authorization" to "Bearer token")
    every { mockPrefs.getString(any(), any()) } returns null

    val result = UpdatesConfigurationOverride.saveRequestHeaders(mockContext, requestHeaders)

    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result?.updateUrl).isNull()
    Truth.assertThat(result?.requestHeaders).isEqualTo(requestHeaders)
  }

  @Test
  fun `saveRequestHeaders should update existing override`() {
    val existingJson = """{"updateUrl":"https://example.com/manifest"}"""
    val newHeaders = mapOf("User-Agent" to "ExpoApp")
    every { mockPrefs.getString(any(), any()) } returns existingJson

    val result = UpdatesConfigurationOverride.saveRequestHeaders(mockContext, newHeaders)

    Truth.assertThat(result).isNotNull()
    Truth.assertThat(result?.updateUrl).isEqualTo("https://example.com/manifest".toUri())
    Truth.assertThat(result?.requestHeaders).isEqualTo(newHeaders)
  }

  @Test
  fun `saveRequestHeaders with null value should return null when no other values exist`() {
    every { mockPrefs.getString(any(), any()) } returns null

    val result = UpdatesConfigurationOverride.saveRequestHeaders(mockContext, null)

    Truth.assertThat(result).isNull()
    verify { mockEditor.remove(any()) }
  }

  @Test
  fun `fromJSONObject should parse JSON with both updateUrl and requestHeaders`() {
    val json = JSONObject().apply {
      put("updateUrl", "https://example.com/manifest")
      put("requestHeaders", JSONObject(mapOf("Authorization" to "Bearer token")))
    }

    val result = UpdatesConfigurationOverride.fromJSONObject(json)

    Truth.assertThat(result.updateUrl).isEqualTo("https://example.com/manifest".toUri())
    Truth.assertThat(result.requestHeaders).isEqualTo(mapOf("Authorization" to "Bearer token"))
  }

  @Test
  fun `fromJSONObject should parse JSON with only updateUrl`() {
    val json = JSONObject().apply {
      put("updateUrl", "https://example.com/manifest")
    }

    val result = UpdatesConfigurationOverride.fromJSONObject(json)

    Truth.assertThat(result.updateUrl).isEqualTo("https://example.com/manifest".toUri())
    Truth.assertThat(result.requestHeaders).isNull()
  }

  @Test
  fun `fromJSONObject should parse JSON with only requestHeaders`() {
    val json = JSONObject().apply {
      put("requestHeaders", JSONObject(mapOf("Authorization" to "Bearer token")))
    }

    val result = UpdatesConfigurationOverride.fromJSONObject(json)

    Truth.assertThat(result.updateUrl).isNull()
    Truth.assertThat(result.requestHeaders).isEqualTo(mapOf("Authorization" to "Bearer token"))
  }

  @Test
  fun `fromJSONObject should handle empty JSON`() {
    val json = JSONObject()

    val result = UpdatesConfigurationOverride.fromJSONObject(json)

    Truth.assertThat(result.updateUrl).isNull()
    Truth.assertThat(result.requestHeaders).isNull()
  }

  @Test
  fun `toJSONObject should serialize both updateUrl and requestHeaders`() {
    val updateUrl = "https://example.com/manifest".toUri()
    val requestHeaders = mapOf("Authorization" to "Bearer token", "User-Agent" to "ExpoApp")
    val override = UpdatesConfigurationOverride(updateUrl, requestHeaders)

    val json = override.toJSONObject()

    Truth.assertThat(json.getString("updateUrl")).isEqualTo("https://example.com/manifest")
    val headersJson = json.getJSONObject("requestHeaders")
    Truth.assertThat(headersJson.getString("Authorization")).isEqualTo("Bearer token")
    Truth.assertThat(headersJson.getString("User-Agent")).isEqualTo("ExpoApp")
  }

  @Test
  fun `toJSONObject should serialize only updateUrl when requestHeaders is null`() {
    val updateUrl = "https://example.com/manifest".toUri()
    val override = UpdatesConfigurationOverride(updateUrl, null)

    val json = override.toJSONObject()

    Truth.assertThat(json.getString("updateUrl")).isEqualTo("https://example.com/manifest")
    Truth.assertThat(json.has("requestHeaders")).isFalse()
  }

  @Test
  fun `toJSONObject should serialize only requestHeaders when updateUrl is null`() {
    val requestHeaders = mapOf("Authorization" to "Bearer token")
    val override = UpdatesConfigurationOverride(null, requestHeaders)

    val json = override.toJSONObject()

    Truth.assertThat(json.has("updateUrl")).isFalse()
    val headersJson = json.getJSONObject("requestHeaders")
    Truth.assertThat(headersJson.getString("Authorization")).isEqualTo("Bearer token")
  }

  @Test
  fun `toJSONObject should return empty JSON when both values are null`() {
    val override = UpdatesConfigurationOverride(null, null)

    val json = override.toJSONObject()

    Truth.assertThat(json.length()).isEqualTo(0)
  }
}
