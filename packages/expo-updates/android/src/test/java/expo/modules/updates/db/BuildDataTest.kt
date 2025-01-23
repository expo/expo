package expo.modules.updates.db

import android.net.Uri
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesConfiguration.CheckAutomaticallyConfiguration
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class BuildDataTest {
  @Test
  fun `isBuildDataConsistent should return true for same data`() {
    val sourceBuildData = createUpdatesConfiguration(
      updateUrl = "https://example.com",
      requestHeaders = mapOf(
        "expo-channel-name" to "default"
      )
    )
    val targetRequestHeader = JSONObject().apply {
      put("expo-channel-name", "default")
    }
    val targetBuildData = JSONObject().apply {
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, Uri.parse("https://example.com"))
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, targetRequestHeader)
    }
    Assert.assertTrue(BuildData.isBuildDataConsistent(sourceBuildData, targetBuildData))
  }

  @Test
  fun `isBuildDataConsistent should return false for EXUpdatesRequestHeaders change`() {
    val sourceBuildData = createUpdatesConfiguration(
      updateUrl = "https://example.com",
      requestHeaders = mapOf(
        "expo-channel-name" to "default"
      )
    )
    val targetRequestHeader = JSONObject().apply {
      put("expo-channel-name", "preview")
    }
    val targetBuildData = JSONObject().apply {
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, Uri.parse("https://example.com"))
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, targetRequestHeader)
    }
    Assert.assertFalse(BuildData.isBuildDataConsistent(sourceBuildData, targetBuildData))
  }

  @Test
  fun `isBuildDataConsistent support migration with new UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY key`() {
    val sourceBuildData = createUpdatesConfiguration(
      updateUrl = "https://example.com",
      requestHeaders = mapOf(
        "expo-channel-name" to "default"
      )
    )
    val targetRequestHeader = JSONObject().apply {
      put("expo-channel-name", "default")
    }
    val targetBuildData = JSONObject().apply {
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, Uri.parse("https://example.com"))
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, targetRequestHeader)
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY, true)
    }
    Assert.assertTrue(BuildData.isBuildDataConsistent(sourceBuildData, targetBuildData))
  }

  @Test
  fun `isBuildDataConsistent should not overwrite existing data from the default build data`() {
    val sourceBuildData = createUpdatesConfiguration(
      updateUrl = "https://example.com",
      requestHeaders = mapOf(
        "expo-channel-name" to "default"
      ),
      hasEmbeddedUpdate = false
    )
    val targetRequestHeader = JSONObject().apply {
      put("expo-channel-name", "default")
    }
    val targetBuildData = JSONObject().apply {
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY, Uri.parse("https://example.com"))
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, targetRequestHeader)
      put(UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY, false)
    }
    Assert.assertTrue(BuildData.isBuildDataConsistent(sourceBuildData, targetBuildData))
  }

  private fun createUpdatesConfiguration(
    updateUrl: String,
    requestHeaders: Map<String, String>,
    hasEmbeddedUpdate: Boolean = true
  ): UpdatesConfiguration {
    return UpdatesConfiguration(
      scopeKey = updateUrl,
      updateUrl = Uri.parse(updateUrl),
      runtimeVersionRaw = "1.0.0",
      launchWaitMs = 0,
      checkOnLaunch = CheckAutomaticallyConfiguration.ALWAYS,
      hasEmbeddedUpdate = hasEmbeddedUpdate,
      requestHeaders = requestHeaders,
      codeSigningCertificate = null,
      codeSigningMetadata = emptyMap(),
      codeSigningIncludeManifestResponseCertificateChain = false,
      codeSigningAllowUnsignedManifests = false,
      enableExpoUpdatesProtocolV0CompatibilityMode = false,
      disableAntiBrickingMeasures = false,
    )
  }
}
