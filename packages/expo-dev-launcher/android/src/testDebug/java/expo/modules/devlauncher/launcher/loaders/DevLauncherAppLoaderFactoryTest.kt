package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.ReactNativeHost
import com.google.common.truth.Truth
import expo.modules.devlauncher.helpers.DevLauncherInstallationIDHelper
import expo.modules.devlauncher.helpers.loadUpdate
import expo.modules.devlauncher.koin.DevLauncherKoinContext
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesInterface
import io.mockk.coEvery
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
import java.lang.Exception

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherAppLoaderFactoryTest {

  private val developmentManifestURL = Uri.parse("http://10.0.2.2:8081")
  private val developmentManifestJSONString = "{\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"orientation\":\"portrait\",\"icon\":\"./assets/icon.png\",\"sdkVersion\":\"42.0.0\",\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/sdk42updates\"},\"packagerOpts\":{\"scheme\":null,\"hostType\":\"lan\",\"lanType\":\"ip\",\"devClient\":false,\"dev\":true,\"minify\":false,\"urlRandomness\":null,\"https\":false},\"mainModuleName\":\"node_modules/expo/AppEntry\",\"bundleUrl\":\"http://192.168.0.58:19000/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&minify=false\",\"debuggerHost\":\"192.168.0.58:19000\",\"logUrl\":\"http://192.168.0.58:19000/logs\",\"hostUri\":\"192.168.0.58:19000\",\"iconUrl\":\"http://192.168.0.58:19000/assets/./assets/icon.png\"}"
  private val publishedManifestURL = Uri.parse("https://exp.host/@esamelson/sdk42updates")
  private val publishedManifestJSONString = "{\"icon\":\"./assets/icon.png\",\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"splash\":{\"image\":\"./assets/splash.png\",\"imageUrl\":\"https://classic-assets.eascdn.net/~assets/201a91bd1740bb1d6a1dbad049310724\",\"resizeMode\":\"contain\",\"backgroundColor\":\"#ffffff\"},\"iconUrl\":\"https://classic-assets.eascdn.net/~assets/4e3f888fc8475f69fd5fa32f1ad5216a\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"orientation\":\"portrait\",\"currentFullName\":\"@esamelson/sdk42updates\",\"originalFullName\":\"@esamelson/sdk42updates\",\"id\":\"@esamelson/sdk42updates\",\"projectId\":\"04e1e9f2-b297-44da-a11c-90a6a27859bc\",\"scopeKey\":\"@esamelson/sdk42updates\",\"releaseId\":\"a2b0a544-40f0-4fd6-9972-19f094380681\",\"publishedTime\":\"2021-07-13T22:29:24.170Z\",\"commitTime\":\"2021-07-13T22:29:24.209Z\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F8c3e605420e77ba9fe35a0a7ef8459a9-42.0.0-ios.js\",\"bundleKey\":\"8c3e605420e77ba9fe35a0a7ef8459a9\",\"releaseChannel\":\"default\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}"

  @Before
  fun setup() {
    val reactNativeHost = mockk<ReactNativeHost>(relaxed = true)
    val devLauncherController = mockk<DevLauncherControllerInterface>(relaxed = true)
    DevLauncherKoinContext.app.koin.loadModules(
      listOf(
        module {
          single<Context> { ApplicationProvider.getApplicationContext() }
          single { reactNativeHost }
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
    }
    val appLoaderFactory = DevLauncherAppLoaderFactory()

    val manifestParser = mockk<DevLauncherManifestParser>()
    coEvery { manifestParser.isManifestUrl() } returns true

    val appLoader = appLoaderFactory.createAppLoader(publishedManifestURL, developmentManifestURL, manifestParser)
    Truth.assertThat(appLoader).isInstanceOf(DevLauncherPublishedAppLoader::class.java)
    Truth.assertThat(appLoaderFactory.shouldUseDeveloperSupport()).isFalse()
  }

  private fun mockUpdatesInterface(manifestJSONString: String, verifyShouldContinue: (Boolean) -> Unit) {
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
        override fun getManifest(): JSONObject = manifest
        override fun getLaunchAssetPath(): String = ""
      }
    }

    DevLauncherKoinContext.app.koin.loadModules(
      listOf(
        module {
          single { updatesInterface }
        }
      )
    )
  }
}
