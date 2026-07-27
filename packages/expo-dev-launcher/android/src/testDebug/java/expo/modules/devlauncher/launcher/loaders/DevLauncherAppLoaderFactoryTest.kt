package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.ReactHost
import com.google.common.truth.Truth
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.helpers.loadUpdate
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesDevLauncherInterface
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkConstructor
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkConstructor
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherAppLoaderFactoryTest {

  private val developmentManifestURL = Uri.parse("http://10.0.2.2:8081")
  private val developmentManifestJSONString = "{\"metadata\":{},\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"},\"extra\":{\"expoGo\":{\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/updates-unit-test-template\"},\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/sdk42updates\"},\"packagerOpts\":{\"scheme\":null,\"hostType\":\"lan\",\"lanType\":\"ip\",\"dev\":true,\"minify\":false,\"urlRandomness\":null,\"https\":false}}}}"
  private val publishedManifestURL = Uri.parse("https://exp.host/@esamelson/sdk42updates")
  private val publishedManifestJSONString = "{\"metadata\":{},\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"285dc9ca-a25d-4f60-93be-36dc312266d7\"}}}"

  private val context: Context = ApplicationProvider.getApplicationContext()
  private val appHost = mockk<ReactHost>(relaxed = true)
  private val controller = mockk<DevLauncherController>(relaxed = true)
  private val installationIDHelper = mockk<DevLauncherInstallationIDHelper>(relaxed = true)

  @Before
  fun setUp() {
    mockkConstructor(DevLauncherManifestParser::class)
  }

  @After
  fun tearDown() {
    unmockkConstructor(DevLauncherManifestParser::class)
  }

  @Test
  fun `loads embedded bundle if url is an asset url`() = runBlocking<Unit> {
    val assetUrl = Uri.parse("assets://index.android.bundle")

    val result = createAppLoader(assetUrl, assetUrl, context, appHost, null, controller, installationIDHelper)
    Truth.assertThat(result.appLoader).isInstanceOf(DevLauncherEmbeddedAppLoader::class.java)
    Truth.assertThat(result.useDeveloperSupport).isFalse()
    Truth.assertThat(result.manifest).isNull()
    Truth.assertThat(result.manifestURL).isNull()
    Truth.assertThat(result.devLauncherUrl).isNull()
  }

  @Test
  fun `loads app as React Native bundle if url is not a manifest url`() = runBlocking<Unit> {
    coEvery { anyConstructed<DevLauncherManifestParser>().isManifestUrl() } returns false

    val result = createAppLoader(developmentManifestURL, developmentManifestURL, context, appHost, null, controller, installationIDHelper)
    Truth.assertThat(result.appLoader).isInstanceOf(DevLauncherReactNativeAppLoader::class.java)
    Truth.assertThat(result.useDeveloperSupport).isTrue()
  }

  @Test
  fun `loads app locally if manifest indicates developer tool and no updatesInterface exists`() = runBlocking<Unit> {
    val manifest = Manifest.fromManifestJson(JSONObject(developmentManifestJSONString))
    coEvery { anyConstructed<DevLauncherManifestParser>().isManifestUrl() } returns true
    coEvery { anyConstructed<DevLauncherManifestParser>().parseManifest() } returns manifest

    val result = createAppLoader(developmentManifestURL, developmentManifestURL, context, appHost, null, controller, installationIDHelper)
    Truth.assertThat(result.appLoader).isInstanceOf(DevLauncherLocalAppLoader::class.java)
    Truth.assertThat(result.useDeveloperSupport).isTrue()
  }

  @Test
  fun `throws if manifest is published and no updatesInterface exists`() {
    val manifest = Manifest.fromManifestJson(JSONObject(publishedManifestJSONString))
    coEvery { anyConstructed<DevLauncherManifestParser>().isManifestUrl() } returns true
    coEvery { anyConstructed<DevLauncherManifestParser>().parseManifest() } returns manifest

    Assert.assertThrows(Exception::class.java) {
      runBlocking { createAppLoader(publishedManifestURL, developmentManifestURL, context, appHost, null, controller, installationIDHelper) }
    }
  }

  @Test
  fun `loads app locally if manifest indicates developer tool and updatesInterface exists`() = runBlocking<Unit> {
    val updatesInterface = mockUpdatesInterface(developmentManifestJSONString) {
      Truth.assertThat(it).isFalse()
    }
    every { updatesInterface.isValidUpdatesConfiguration(any()) } returns true

    coEvery { anyConstructed<DevLauncherManifestParser>().isManifestUrl() } returns true

    val result = createAppLoader(developmentManifestURL, developmentManifestURL, context, appHost, updatesInterface, controller, installationIDHelper)
    Truth.assertThat(result.appLoader).isInstanceOf(DevLauncherLocalAppLoader::class.java)
    Truth.assertThat(result.useDeveloperSupport).isTrue()
  }

  @Test
  fun `loads published app if manifest is published and updatesInterface exists`() = runBlocking<Unit> {
    val updatesInterface = mockUpdatesInterface(publishedManifestJSONString) {
      Truth.assertThat(it).isTrue()
    }
    every { updatesInterface.isValidUpdatesConfiguration(any()) } returns true

    coEvery { anyConstructed<DevLauncherManifestParser>().isManifestUrl() } returns true

    val result = createAppLoader(publishedManifestURL, developmentManifestURL, context, appHost, updatesInterface, controller, installationIDHelper)
    Truth.assertThat(result.appLoader).isInstanceOf(DevLauncherPublishedAppLoader::class.java)
    Truth.assertThat(result.useDeveloperSupport).isFalse()
  }

  @Test
  fun `loads app locally if manifest indicates developer tool but updates is mis-configured`() = runBlocking<Unit> {
    val updatesInterface = mockUpdatesInterface(developmentManifestJSONString) {
      Truth.assertThat(it).isTrue()
    }
    every { updatesInterface.isValidUpdatesConfiguration(any()) } returns false

    val manifest = Manifest.fromManifestJson(JSONObject(developmentManifestJSONString))
    coEvery { anyConstructed<DevLauncherManifestParser>().isManifestUrl() } returns true
    coEvery { anyConstructed<DevLauncherManifestParser>().parseManifest() } returns manifest

    val result = createAppLoader(developmentManifestURL, developmentManifestURL, context, appHost, updatesInterface, controller, installationIDHelper)
    Truth.assertThat(result.appLoader).isInstanceOf(DevLauncherLocalAppLoader::class.java)
    Truth.assertThat(result.useDeveloperSupport).isTrue()
  }

  private fun mockUpdatesInterface(manifestJSONString: String, verifyShouldContinue: (Boolean) -> Unit): UpdatesDevLauncherInterface {
    val updatesInterface = mockk<UpdatesDevLauncherInterface>(relaxed = true)
    val manifest = JSONObject(manifestJSONString)
    val slot = slot<(JSONObject) -> Boolean>()

    every { updatesInterface.runtimeVersion } returns "1"

    // mock extension function defined at the module level
    mockkStatic("expo.modules.devlauncher.helpers.DevLauncherUpdatesHelperKt")

    coEvery {
      updatesInterface.loadUpdate(
        configuration = any(),
        context = any(),
        shouldContinue = capture(slot)
      )
    } answers {
      // fire captured shouldContinue callback and verify return value is what we expect
      verifyShouldContinue(slot.captured(manifest))

      object : UpdatesDevLauncherInterface.Update {
        override val manifest: JSONObject = manifest
        override val launchAssetPath: String = ""
      }
    }

    return updatesInterface
  }
}
