package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.helpers.loadUpdate
import expo.modules.devlauncher.koin.DevLauncherKoinContext
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesInterface
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.koin.dsl.module
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherAppLoaderFactoryTest {

  private val developmentManifestURL = Uri.parse("http://10.0.2.2:8081")
  private val developmentManifestJSONString = "{\"metadata\":{},\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"},\"extra\":{\"expoGo\":{\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/updates-unit-test-template\"},\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/sdk42updates\"},\"packagerOpts\":{\"scheme\":null,\"hostType\":\"lan\",\"lanType\":\"ip\",\"dev\":true,\"minify\":false,\"urlRandomness\":null,\"https\":false}}}}"
  private val publishedManifestURL = Uri.parse("https://exp.host/@esamelson/sdk42updates")
  private val publishedManifestJSONString = "{\"metadata\":{},\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"285dc9ca-a25d-4f60-93be-36dc312266d7\"}}}"

  @Before
  fun setup() {
    val reactHost = mockk<ReactHostWrapper>(relaxed = true)
    val devLauncherController = mockk<DevLauncherControllerInterface>(relaxed = true)
    DevLauncherKoinContext.app.koin.loadModules(
      listOf(
        module {
          single<Context> { ApplicationProvider.getApplicationContext() }
          single { reactHost }
          single { devLauncherController }
          single<UpdatesInterface?> { null }
          single { mockk<DevLauncherInstallationIDHelper>(relaxed = true) }
        }
      )
    )
  }

  @Test
  fun `loads app as React Native bundle if url is not a manifest url`() = runBlocking<Unit> {
    val appLoaderFactory = DevLauncherAppLoaderFactory()

    val manifestParser = mockk<DevLauncherManifestParser>()
    coEvery { manifestParser.isManifestUrl() } returns false

    val appLoader = appLoaderFactory.createAppLoader(developmentManifestURL, developmentManifestURL, manifestParser)
    Truth.assertThat(appLoader).isInstanceOf(DevLauncherReactNativeAppLoader::class.java)
    Truth.assertThat(appLoaderFactory.shouldUseDeveloperSupport()).isTrue()
  }

  @Test
  fun `loads app locally if manifest indicates developer tool and no updatesInterface exists`() = runBlocking<Unit> {
    val appLoaderFactory = DevLauncherAppLoaderFactory()

    val manifestParser = mockk<DevLauncherManifestParser>()
    val manifest = Manifest.fromManifestJson(JSONObject(developmentManifestJSONString))
    coEvery { manifestParser.isManifestUrl() } returns true
    coEvery { manifestParser.parseManifest() } returns manifest

    val appLoader = appLoaderFactory.createAppLoader(developmentManifestURL, developmentManifestURL, manifestParser)
    Truth.assertThat(appLoader).isInstanceOf(DevLauncherLocalAppLoader::class.java)
    Truth.assertThat(appLoaderFactory.shouldUseDeveloperSupport()).isTrue()
  }

  @Test
  fun `throws if manifest is published and no updatesInterface exists`() {
    val appLoaderFactory = DevLauncherAppLoaderFactory()

    val manifestParser = mockk<DevLauncherManifestParser>()
    val manifest = Manifest.fromManifestJson(JSONObject(publishedManifestJSONString))
    coEvery { manifestParser.isManifestUrl() } returns true
    coEvery { manifestParser.parseManifest() } returns manifest

    Assert.assertThrows(Exception::class.java) {
      runBlocking { appLoaderFactory.createAppLoader(publishedManifestURL, developmentManifestURL, manifestParser) }
    }
  }

  @Test
  fun `loads app locally if manifest indicates developer tool and updatesInterface exists`() = runBlocking<Unit> {
    mockUpdatesInterface(developmentManifestJSONString) {
      Truth.assertThat(it).isFalse()
    }.let { updatesInterface ->
      every { updatesInterface.isValidUpdatesConfiguration(any()) } returns true
    }
    val appLoaderFactory = DevLauncherAppLoaderFactory()

    val manifestParser = mockk<DevLauncherManifestParser>()
    coEvery { manifestParser.isManifestUrl() } returns true

    val appLoader = appLoaderFactory.createAppLoader(developmentManifestURL, developmentManifestURL, manifestParser)
    Truth.assertThat(appLoader).isInstanceOf(DevLauncherLocalAppLoader::class.java)
    Truth.assertThat(appLoaderFactory.shouldUseDeveloperSupport()).isTrue()
  }

  @Test
  fun `loads published app if manifest is published and updatesInterface exists`() = runBlocking<Unit> {
    mockUpdatesInterface(publishedManifestJSONString) {
      Truth.assertThat(it).isTrue()
    }.let { updatesInterface ->
      every { updatesInterface.isValidUpdatesConfiguration(any()) } returns true
    }
    val appLoaderFactory = DevLauncherAppLoaderFactory()

    val manifestParser = mockk<DevLauncherManifestParser>()
    coEvery { manifestParser.isManifestUrl() } returns true

    val appLoader = appLoaderFactory.createAppLoader(publishedManifestURL, developmentManifestURL, manifestParser)
    Truth.assertThat(appLoader).isInstanceOf(DevLauncherPublishedAppLoader::class.java)
    Truth.assertThat(appLoaderFactory.shouldUseDeveloperSupport()).isFalse()
  }

  @Test
  fun `loads app locally if manifest indicates developer tool but updates is mis-configured`() = runBlocking<Unit> {
    mockUpdatesInterface(developmentManifestJSONString) {
      Truth.assertThat(it).isTrue()
    }.let { updatesInterface ->
      every { updatesInterface.isValidUpdatesConfiguration(any()) } returns false
    }
    val appLoaderFactory = DevLauncherAppLoaderFactory()

    val manifestParser = mockk<DevLauncherManifestParser>()
    val manifest = Manifest.fromManifestJson(JSONObject(developmentManifestJSONString))
    coEvery { manifestParser.isManifestUrl() } returns true
    coEvery { manifestParser.parseManifest() } returns manifest

    val appLoader = appLoaderFactory.createAppLoader(developmentManifestURL, developmentManifestURL, manifestParser)
    Truth.assertThat(appLoader).isInstanceOf(DevLauncherLocalAppLoader::class.java)
    Truth.assertThat(appLoaderFactory.shouldUseDeveloperSupport()).isTrue()
  }

  private fun mockUpdatesInterface(manifestJSONString: String, verifyShouldContinue: (Boolean) -> Unit): UpdatesInterface {
    val updatesInterface = mockk<UpdatesInterface>()
    val manifest = JSONObject(manifestJSONString)
    val slot = slot<(JSONObject) -> Boolean>()

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

      object : UpdatesInterface.Update {
        override val manifest: JSONObject = manifest
        override val launchAssetPath: String = ""
      }
    }

    DevLauncherKoinContext.app.koin.loadModules(
      listOf(
        module {
          single { updatesInterface }
        }
      )
    )

    return updatesInterface
  }
}
