package expo.modules.updates.selectionpolicy

import android.content.Context
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesConfigurationOverride
import expo.modules.updates.manifest.ExpoUpdatesUpdate
import org.json.JSONObject
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LauncherSelectionPolicyFilterAwareTest {
  private val context: Context = ApplicationProvider.getApplicationContext()
  private val runtimeVersion = "1.0"
  private val scopeKey = "dummyScope"
  private val url = Uri.parse("https://example.com")
  private val headers = mapOf("expo-channel-name" to "default")
  private val overrideUrl = Uri.parse("https://override.example.com")
  private val overrideHeaders = mapOf("expo-channal-name" to "override")
  private val manifestFilters = JSONObject("{\"branchname\": \"default\"}")

  private val launchAsset = JSONObject(
    """
    {
      "hash": "DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA",
      "key": "0436e5821bff7b95a84c21f22a43cb96.bundle",
      "contentType": "application/javascript",
      "fileExtension": ".js",
      "url": "https://url.to/bundle"
    }
    """.trimIndent()
  )

  private val imageAsset = JSONObject(
    """
    {
      "hash": "JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo",
      "key": "3261e570d51777be1e99116562280926.png",
      "contentType": "image/png",
      "fileExtension": ".png",
      "url": "https://url.to/asset"
    }
    """.trimIndent()
  )

  private lateinit var config: UpdatesConfiguration
  private lateinit var configWithOverride: UpdatesConfiguration
  private lateinit var updateWithOverrideUrl: ExpoUpdatesUpdate
  private lateinit var updateWithDifferentUrl: ExpoUpdatesUpdate
  private lateinit var updateWithOverrideHeaders: ExpoUpdatesUpdate
  private lateinit var updateWithDifferentHeaders: ExpoUpdatesUpdate

  @Before
  fun setup() {
    config = UpdatesConfiguration(
      context = context,
      overrideMap = mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to url,
        UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to runtimeVersion,
        UpdatesConfiguration.UPDATES_CONFIGURATION_SCOPE_KEY_KEY to scopeKey,
        UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY to headers,
        UpdatesConfiguration.UPDATES_CONFIGURATION_DISABLE_ANTI_BRICKING_MEASURES to true
      )
    )

    configWithOverride = UpdatesConfiguration.create(
      context,
      config,
      UpdatesConfigurationOverride(
        updateUrl = overrideUrl,
        requestHeaders = overrideHeaders
      )
    )

    updateWithOverrideUrl = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
      ExpoUpdatesManifest(
        JSONObject(
          """
        {
          "id": "079cde35-8433-4c17-81c8-7117c1513e76",
          "createdAt": "2021-01-15T19:39:22.480Z",
          "runtimeVersion": "$runtimeVersion",
          "launchAsset": $launchAsset,
          "assets": [$imageAsset],
          "metadata": {"branchName": "default"}
        }
          """.trimIndent()
        )
      ),
      null, configWithOverride
    )

    updateWithDifferentUrl = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
      ExpoUpdatesManifest(
        JSONObject(
          """
        {
          "id": "079cde35-8433-4c17-81c8-7117c1513e77",
          "createdAt": "2021-01-16T19:39:22.480Z",
          "runtimeVersion": "$runtimeVersion",
          "launchAsset": $launchAsset,
          "assets": [$imageAsset],
          "metadata": {"branchName": "default"}
        }
          """.trimIndent()
        )
      ),
      null,
      UpdatesConfiguration.create(
        context,
        config,
        UpdatesConfigurationOverride(
          updateUrl = Uri.parse("https://different.example.com"),
          requestHeaders = mapOf()
        )
      )
    )

    updateWithOverrideHeaders = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
      ExpoUpdatesManifest(
        JSONObject(
          """
        {
          "id": "079cde35-8433-4c17-81c8-7117c1513e78",
          "createdAt": "2021-01-17T19:39:22.480Z",
          "runtimeVersion": "1.0",
          "launchAsset": $launchAsset,
          "assets": [$imageAsset],
          "metadata": {"branchName": "default"}
        }
          """.trimIndent()
        )
      ),
      null,
      UpdatesConfiguration.create(
        context,
        config,
        UpdatesConfigurationOverride(
          updateUrl = url,
          requestHeaders = overrideHeaders
        )
      )
    )

    updateWithDifferentHeaders = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
      ExpoUpdatesManifest(
        JSONObject(
          """
        {
          "id": "079cde35-8433-4c17-81c8-7117c1513e79",
          "createdAt": "2021-01-18T19:39:22.480Z",
          "runtimeVersion": "$runtimeVersion",
          "launchAsset": $launchAsset,
          "assets": [$imageAsset],
          "metadata": {"branchName": "default"}
        }
          """.trimIndent()
        )
      ),
      null,
      UpdatesConfiguration.create(
        context,
        config,
        UpdatesConfigurationOverride(
          updateUrl = url,
          requestHeaders = mapOf("Authorization" to "Bearer different_token")
        )
      )
    )
  }

  @Test
  fun `should only return update matching override URL and headers`() {
    val launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion, configWithOverride)
    val updates = listOf(
      updateWithOverrideUrl,
      updateWithDifferentUrl,
      updateWithOverrideHeaders,
      updateWithDifferentHeaders
    ).map { it.updateEntity }

    val result = launcherPolicy.selectUpdateToLaunch(updates, manifestFilters)
    Truth.assertThat(result).isEqualTo(updateWithOverrideUrl.updateEntity)
  }

  @Test
  fun `should return latest update matching override URL and headers`() {
    val updateOverrideLatest = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
      ExpoUpdatesManifest(
        JSONObject(
          """
        {
          "id": "079cde35-8433-4c17-81c8-7117c1513e76",
          "createdAt": "2025-01-15T19:39:22.480Z",
          "runtimeVersion": "$runtimeVersion",
          "launchAsset": $launchAsset,
          "assets": [$imageAsset],
          "metadata": {"branchName": "default"}
        }
          """.trimIndent()
        )
      ),
      null,
      UpdatesConfiguration.create(
        context,
        config,
        UpdatesConfigurationOverride(
          updateUrl = overrideUrl,
          requestHeaders = overrideHeaders
        )
      )
    )

    val launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion, configWithOverride)
    val updates = listOf(
      updateWithOverrideUrl,
      updateWithDifferentUrl,
      updateOverrideLatest,
      updateWithOverrideHeaders,
      updateWithDifferentHeaders
    ).map { it.updateEntity }

    val result = launcherPolicy.selectUpdateToLaunch(updates, manifestFilters)
    Truth.assertThat(result).isEqualTo(updateOverrideLatest.updateEntity)
  }

  @Test
  fun `should return null when no updates match override URL`() {
    val launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion, configWithOverride)
    val updates = listOf(updateWithDifferentUrl).map { it.updateEntity }
    val result = launcherPolicy.selectUpdateToLaunch(updates, manifestFilters)
    Truth.assertThat(result).isNull()
  }

  @Test
  fun `should return null when no updates match override headers`() {
    val launcherPolicy = LauncherSelectionPolicyFilterAware(runtimeVersion, configWithOverride)
    val updates = listOf(updateWithDifferentHeaders).map { it.updateEntity }
    val result = launcherPolicy.selectUpdateToLaunch(updates, manifestFilters)
    Truth.assertThat(result).isNull()
  }
}
