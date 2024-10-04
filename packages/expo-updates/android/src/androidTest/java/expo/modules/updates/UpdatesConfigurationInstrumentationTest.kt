package expo.modules.updates

import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdatesConfigurationInstrumentationTest {
  @Test
  fun test_runtimeVersion_stripsPrefix() {
    val testPackageName = "test"
    val testRuntimeVersion = "3.14"

    val context = mockk<Context> {
      every { packageName } returns testPackageName
      every { packageManager } returns mockk {
        every { getApplicationInfo(testPackageName, PackageManager.GET_META_DATA) } returns mockk {
          metaData = Bundle().apply {
            putString(
              "expo.modules.updates.EXPO_RUNTIME_VERSION",
              String.format("string:%s", testRuntimeVersion)
            )
          }
        }
      }
    }
    val config = UpdatesConfiguration(context, null)
    Assert.assertEquals(config.runtimeVersion, testRuntimeVersion)
  }

  @Test
  fun test_runtimeVersion_worksWithoutPrefix() {
    val testPackageName = "test"
    val testRuntimeVersion = "3.14"

    val context = mockk<Context> {
      every { packageName } returns testPackageName
      every { packageManager } returns mockk {
        every { getApplicationInfo(testPackageName, PackageManager.GET_META_DATA) } returns mockk {
          metaData = Bundle().apply {
            putString("expo.modules.updates.EXPO_RUNTIME_VERSION", testRuntimeVersion)
          }
        }
      }
    }
    val config = UpdatesConfiguration(context, null)
    Assert.assertEquals(config.runtimeVersion, testRuntimeVersion)
  }

  @Test
  fun test_defaultValues() {
    val testPackageName = "test"
    val context = mockk<Context> {
      every { packageName } returns testPackageName
      every { packageManager } returns mockk {
        every { getApplicationInfo(testPackageName, PackageManager.GET_META_DATA) } returns mockk {
          metaData = Bundle()
        }
      }
    }

    val config = UpdatesConfiguration(context, null)
    Assert.assertEquals(true, config.isEnabled)
    Assert.assertEquals(false, config.expectsSignedManifest)
    Assert.assertEquals("default", config.releaseChannel)
    Assert.assertEquals(0, config.launchWaitMs)
    Assert.assertEquals(UpdatesConfiguration.CheckAutomaticallyConfiguration.ALWAYS, config.checkOnLaunch)
    Assert.assertEquals(true, config.hasEmbeddedUpdate)
    Assert.assertEquals(false, config.codeSigningIncludeManifestResponseCertificateChain)
  }

  @Test
  fun test_primitiveTypeFields_nonDefaultValues() {
    val testPackageName = "test"
    val context = mockk<Context> {
      every { packageName } returns testPackageName
      every { packageManager } returns mockk {
        every { getApplicationInfo(testPackageName, PackageManager.GET_META_DATA) } returns mockk {
          metaData = Bundle().apply {
            putBoolean("expo.modules.updates.ENABLED", false)
            putInt("expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS", 1000)
            putBoolean("expo.modules.updates.HAS_EMBEDDED_UPDATE", false)
            putBoolean("expo.modules.updates.CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN", true)
          }
        }
      }
    }

    val config = UpdatesConfiguration(context, null)
    Assert.assertEquals(false, config.isEnabled)
    Assert.assertEquals(1000, config.launchWaitMs)
    Assert.assertEquals(false, config.hasEmbeddedUpdate)
    Assert.assertEquals(true, config.codeSigningIncludeManifestResponseCertificateChain)
  }

  @Test
  fun test_initialization_mapTakesPrecedenceOverContext() {
    val testPackageName = "test"

    val context = mockk<Context> {
      every { packageName } returns testPackageName
      every { packageManager } returns mockk {
        every { getApplicationInfo(testPackageName, PackageManager.GET_META_DATA) } returns mockk {
          metaData = Bundle().apply {
            putBoolean("expo.modules.updates.ENABLED", true)
            putString("expo.modules.updates.EXPO_SCOPE_KEY", "invalid")
            putString("expo.modules.updates.EXPO_UPDATE_URL", "http://invalid.com")
            putString("expo.modules.updates.EXPO_SDK_VERSION", "invalid")
            putString("expo.modules.updates.EXPO_RUNTIME_VERSION", "invalid")
            putString("expo.modules.updates.EXPO_RELEASE_CHANNEL", "invalid")
            putInt("expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS", 9000)
            putString("expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH", "ALWAYS")
            putBoolean("expo.modules.updates.HAS_EMBEDDED_UPDATE", true)
            putString("expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY", "{\"test\":\"invalid\"}")
            putString("expo.modules.updates.CODE_SIGNING_CERTIFICATE", "invalid")
            putString("expo.modules.updates.CODE_SIGNING_METADATA", "{\"test\":\"invalid\"}")
          }
        }
      }
    }

    val config = UpdatesConfiguration(
      context,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_ENABLED_KEY to false,
        UpdatesConfiguration.UPDATES_CONFIGURATION_SCOPE_KEY_KEY to "override",
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("http://override.com"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY to mapOf("test" to "override"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY to "override",
        UpdatesConfiguration.UPDATES_CONFIGURATION_SDK_VERSION_KEY to "override",
        UpdatesConfiguration.UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY to "override",
        UpdatesConfiguration.UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY to "NEVER",
        UpdatesConfiguration.UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY to 1000,
        UpdatesConfiguration.UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY to false,
        UpdatesConfiguration.UPDATES_CONFIGURATION_EXPECTS_EXPO_SIGNED_MANIFEST to false,
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE to "override",
        UpdatesConfiguration.UPDATES_CONFIGURATION_CODE_SIGNING_METADATA to mapOf("test" to "override"),
      )
    )

    Assert.assertEquals(false, config.isEnabled)
    Assert.assertEquals(false, config.expectsSignedManifest)
    Assert.assertEquals("override", config.scopeKey)
    Assert.assertEquals(Uri.parse("http://override.com"), config.updateUrl)
    Assert.assertEquals("override", config.sdkVersion)
    Assert.assertEquals("override", config.runtimeVersion)
    Assert.assertEquals("override", config.releaseChannel)
    Assert.assertEquals(1000, config.launchWaitMs)
    Assert.assertEquals(UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER, config.checkOnLaunch)
    Assert.assertEquals(false, config.hasEmbeddedUpdate)
    Assert.assertEquals(mapOf("test" to "override"), config.requestHeaders)
    Assert.assertEquals("override", config.codeSigningCertificate)
    Assert.assertEquals(mapOf("test" to "override"), config.codeSigningMetadata)
  }
}
