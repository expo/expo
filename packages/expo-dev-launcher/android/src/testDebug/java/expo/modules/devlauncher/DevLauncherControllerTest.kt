package expo.modules.devlauncher

import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.ReactNativeHost
import com.google.common.truth.Truth
import expo.modules.devlauncher.launcher.loaders.DevLauncherExpoAppLoader
import expo.modules.devlauncher.launcher.loaders.DevLauncherLocalAppLoader
import expo.modules.devlauncher.launcher.loaders.DevLauncherReactNativeAppLoader
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifest
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.lang.Exception

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherControllerTest {

  private var isControllerInitialized = false

  @Before
  fun reset() {
    if (!isControllerInitialized) {
      val reactNativeHost = mockk<ReactNativeHost>(relaxed = true)
      DevLauncherController.initialize(ApplicationProvider.getApplicationContext(), reactNativeHost)
      isControllerInitialized = true
    }
    DevLauncherController.instance.updatesInterface = null
  }

  @Test
  fun `can initialize controller in test environment`() {
    val instance = DevLauncherController.instance
    Truth.assertThat(instance.useDeveloperSupport)
  }

  @Test
  fun `loads app as React Native bundle if url is not a manifest url`() = runBlocking<Unit> {
    val instance = DevLauncherController.instance

    val url = Uri.parse("http://10.0.2.2:8081")
    val manifestParser = mockk<DevLauncherManifestParser>()
    coEvery { manifestParser.isManifestUrl() } returns false

    val appLoader = instance.loadManifestIntoAppLoader(url, manifestParser)
    Truth.assertThat(appLoader is DevLauncherReactNativeAppLoader)
    Truth.assertThat(instance.useDeveloperSupport)
  }

  @Test
  fun `loads app locally if manifest indicates developer tool and no updatesInterface exists`() = runBlocking<Unit> {
    val instance = DevLauncherController.instance

    val url = Uri.parse("http://10.0.2.2:8081")
    val manifestParser = mockk<DevLauncherManifestParser>()
    val manifest = DevLauncherManifest.fromJson("{\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"version\":\"1.0.0\",\"orientation\":\"portrait\",\"icon\":\"./assets/icon.png\",\"sdkVersion\":\"42.0.0\",\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/sdk42updates\"},\"packagerOpts\":{\"scheme\":null,\"hostType\":\"lan\",\"lanType\":\"ip\",\"devClient\":false,\"dev\":true,\"minify\":false,\"urlRandomness\":null,\"https\":false},\"mainModuleName\":\"node_modules/expo/AppEntry\",\"bundleUrl\":\"http://192.168.0.58:19000/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&minify=false\",\"debuggerHost\":\"192.168.0.58:19000\",\"logUrl\":\"http://192.168.0.58:19000/logs\",\"hostUri\":\"192.168.0.58:19000\",\"iconUrl\":\"http://192.168.0.58:19000/assets/./assets/icon.png\"}".reader())
    coEvery { manifestParser.isManifestUrl() } returns true
    coEvery { manifestParser.parseManifest() } returns manifest

    val appLoader = instance.loadManifestIntoAppLoader(url, manifestParser)
    Truth.assertThat(appLoader is DevLauncherLocalAppLoader)
    Truth.assertThat(instance.useDeveloperSupport)
  }

  @Test
  fun `throws if manifest is published and no updatesInterface exists`() {
    val instance = DevLauncherController.instance

    val url = Uri.parse("http://10.0.2.2:8081")
    val manifestParser = mockk<DevLauncherManifestParser>()
    val manifest = DevLauncherManifest.fromJson("{\"icon\":\"./assets/icon.png\",\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"splash\":{\"image\":\"./assets/splash.png\",\"imageUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/201a91bd1740bb1d6a1dbad049310724\",\"resizeMode\":\"contain\",\"backgroundColor\":\"#ffffff\"},\"iconUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/4e3f888fc8475f69fd5fa32f1ad5216a\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"orientation\":\"portrait\",\"currentFullName\":\"@esamelson/sdk42updates\",\"originalFullName\":\"@esamelson/sdk42updates\",\"id\":\"@esamelson/sdk42updates\",\"projectId\":\"04e1e9f2-b297-44da-a11c-90a6a27859bc\",\"scopeKey\":\"@esamelson/sdk42updates\",\"releaseId\":\"a2b0a544-40f0-4fd6-9972-19f094380681\",\"publishedTime\":\"2021-07-13T22:29:24.170Z\",\"commitTime\":\"2021-07-13T22:29:24.209Z\",\"bundleUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F8c3e605420e77ba9fe35a0a7ef8459a9-42.0.0-ios.js\",\"bundleKey\":\"8c3e605420e77ba9fe35a0a7ef8459a9\",\"releaseChannel\":\"default\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}".reader())
    coEvery { manifestParser.isManifestUrl() } returns true
    coEvery { manifestParser.parseManifest() } returns manifest

    Assert.assertThrows(Exception::class.java) {
      runBlocking { instance.loadManifestIntoAppLoader(url, manifestParser) }
    }
  }
}
