package com.expo.modules.devclient.tests

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import com.expo.modules.devclient.activities.DevClientBundledAppActivity
import com.expo.modules.devclient.activities.reactApplicationHolder
import com.expo.modules.devclient.consts.BundledAppManifest
import com.expo.modules.devclient.koin.DevLauncherKoinTest
import com.expo.modules.devclient.koin.declareInDevLauncherScope
import com.expo.modules.devclient.scenarios.DevLauncherBasicScenario
import com.expo.modules.devclient.scenarios.KoinDeclaration
import com.expo.modules.devclient.scenarios.ReactApplicationCreator
import com.expo.modules.devclient.selectors.Views
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import com.google.common.truth.Truth
import expo.modules.devlauncher.DevLauncherPackage
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.errors.DevLauncherAppError
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivity
import expo.modules.devlauncher.launcher.loaders.DevLauncherAppLoader
import expo.modules.devlauncher.launcher.loaders.DevLauncherAppLoaderFactoryInterface
import expo.modules.devlauncher.launcher.loaders.DevLauncherPublishedAppLoader
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifestParser
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.DevMenuPackage
import expo.modules.manifests.core.Manifest
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
import org.koin.test.inject
import java.io.File
import java.io.IOException

private const val appURL = "http://localhost:1234"

@RunWith(AndroidJUnit4::class)
@LargeTest
internal class DevClientLoadLocalAppTest : DevLauncherKoinTest() {
  private val reactApplicationCreator: ReactApplicationCreator = { app ->
    object : ReactApplication {
      override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(app) {
        override fun getUseDeveloperSupport(): Boolean {
          return false
        }

        override fun getPackages(): List<ReactPackage> {
          return listOf(
            MainReactPackage(null),
            DevLauncherPackage(),
            DevMenuPackage(),
            object : ReactPackage {
              override fun createNativeModules(reactContext: ReactApplicationContext) = emptyList<ReactContextBaseJavaModule>()
              override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> = emptyList()
            }
          )
        }
      }

      override val reactHost: ReactHost
        get() = getDefaultReactHost(app, reactNativeHost)
    }.also {
      reactApplicationHolder = it
    }
  }

  private val koinDeclaration: KoinDeclaration = {
    declareInDevLauncherScope<DevLauncherAppLoaderFactoryInterface> {
      object : DevLauncherAppLoaderFactoryInterface, DevLauncherKoinComponent {
        private val context: Context by inject()
        private val appHost: ReactHostWrapper by inject()
        private val parsedManifest = Manifest.fromManifestJson(JSONObject(BundledAppManifest))
        private val controller: DevLauncherControllerInterface by inject()

        override suspend fun createAppLoader(
          url: Uri,
          projectUrl: Uri,
          manifestParser: DevLauncherManifestParser
        ): DevLauncherAppLoader {
          Truth.assertThat(url).isEqualTo(Uri.parse(appURL))
          return DevLauncherPublishedAppLoader(
            parsedManifest,
            getFileFromAssets(context, "bundled_app.bundle").absolutePath,
            appHost,
            context,
            controller
          )
        }

        override fun getManifest(): Manifest = parsedManifest

        override fun shouldUseDeveloperSupport(): Boolean = false

        @Throws(IOException::class)
        fun getFileFromAssets(context: Context, fileName: String): File = File(context.cacheDir, fileName)
          .also { file ->
            if (file.exists()) {
              file.delete()
            }

            file.outputStream().use { cache ->
              context.assets.open(fileName).use { inputStream ->
                inputStream.copyTo(cache)
              }
            }
          }
      }
    }
  }

  @Test
  fun checks_if_published_app_can_be_opened() = DevLauncherBasicScenario(
    reactApplicationCreator = reactApplicationCreator,
    koinDeclaration = koinDeclaration,
    launcherClass = DevClientBundledAppActivity::class.java
  ).setUpAndLaunch {
    runBlocking {
      it.launcherController()
        .loadApp(Uri.parse("http://localhost:1234"))
    }

    Views.BundledApp.main.isDisplayed()

    it.onAppActivity<DevClientBundledAppActivity> { activity ->
      DevMenuManager.openMenu(activity)
    }

    Views.DevMenu.main.isDisplayed()

    onView(withText("TEST_ACTION")).check(matches(isDisplayed())) // contains custom extension
    onView(withText("Profile")).check(matches(isDisplayed()))
    onView(withText("Settings")).check(matches(isDisplayed()))
    onView(withText("Bundled App")).check(matches(isDisplayed()))
  }

  @Test
  fun checks_if_can_return_to_dev_launcher() = DevLauncherBasicScenario(
    reactApplicationCreator = reactApplicationCreator,
    koinDeclaration = koinDeclaration,
    launcherClass = DevClientBundledAppActivity::class.java
  ).setUpAndLaunch {
    runBlocking {
      it.launcherController()
        .loadApp(Uri.parse(appURL))
    }

    Views.BundledApp.main.isDisplayed()

    it.onAppActivity<DevClientBundledAppActivity> { activity ->
      DevMenuManager.openMenu(activity)
    }

    Views.DevMenu.main.isDisplayed()
    onView(withText("Back to Launcher")).check(matches(isDisplayed()))
    onView(withText("Back to Launcher")).perform(ViewActions.click())

    Views.DevLauncher.main.isDisplayed()
  }

  @Test
  fun checks_if_can_load_app_from_UI() = DevLauncherBasicScenario(
    reactApplicationCreator = reactApplicationCreator,
    koinDeclaration = koinDeclaration,
    launcherClass = DevClientBundledAppActivity::class.java
  ).setUpAndLaunch {
    Views.DevLauncher.urlInput.perform(
      ViewActions.click(),
      ViewActions.typeText(appURL),
      ViewActions.closeSoftKeyboard()
    )

    // TODO: create something similar to the RNClickAction from https://github.com/wix/Detox/blob/8c0e4b530e7cb326117f4d64cb56f0a1ee2392d6/detox/android/detox/src/full/java/com/wix/detox/espresso/action/RNClickAction.java
    Views.DevLauncher.loadAppButton.perform(
      ViewActions.click(),
      ViewActions.click()
    )

    Views.BundledApp.main.isDisplayed()
  }

  @Test
  fun checks_if_app_can_be_reloaded_from_blue_screen() = DevLauncherBasicScenario(
    reactApplicationCreator = reactApplicationCreator,
    koinDeclaration = koinDeclaration,
    launcherClass = DevClientBundledAppActivity::class.java
  ).setUpAndLaunch {
    runBlocking {
      it.launcherController()
        .loadApp(Uri.parse(appURL))
    }

    Views.BundledApp.main.isDisplayed()

    it.onAppActivity<DevClientBundledAppActivity> { activity ->
      DevLauncherErrorActivity.showError(activity, DevLauncherAppError("TEST_ERROR", Error()))
    }

    Views.DevLauncher.ErrorScreen.main.isDisplayed()
    Views.DevLauncher.ErrorScreen.reload.perform(ViewActions.click())

    Views.BundledApp.main.isDisplayed()
  }

  @Test
  fun checks_if_app_can_be_loaded_from_deep_link() = DevLauncherBasicScenario(
    reactApplicationCreator = reactApplicationCreator,
    koinDeclaration = koinDeclaration,
    launcherClass = DevClientBundledAppActivity::class.java
  ).setUpAndLaunch {
    it.onLauncherActivity { launcherActivity ->
      it.launcherController().handleIntent(
        Intent().apply {
          data = Uri.parse("https://expo-development-client?url=$appURL")
        },
        activityToBeInvalidated = launcherActivity
      )
    }

    Views.BundledApp.main.isDisplayed()
  }
}
