package expo.modules.updates.db

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesConfiguration.CheckAutomaticallyConfiguration
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class BuildDataConsistencyTest {
  @Test
  fun test_isBuildDataConsistent_true_same_data() {
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
  fun test_isBuildDataConsistent_false_headers_change() {
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
  fun test_isBuildDataConsistent_migration_hasEmbeddedUpdate() {
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
  fun test_isBuildDataConsistent_does_not_override_existing_with_default() {
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
      disableAntiBrickingMeasures = false
    )
  }
}
