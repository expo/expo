package expo.modules.webbrowser

import android.content.Intent
import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.webbrowser.error.PackageManagerNotFoundException
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertListsEqual
import org.unimodules.test.core.assertSetsEqual
import org.unimodules.test.core.assertStringValueNull
import org.unimodules.test.core.mockInternalModule
import org.unimodules.test.core.mockkInternalModule
import org.unimodules.test.core.moduleRegistryMock
import org.unimodules.test.core.promiseRejected
import org.unimodules.test.core.promiseResolved

@RunWith(RobolectricTestRunner::class)
internal class WebBrowserModuleTest {

  private var moduleRegistry = moduleRegistryMock()

  private lateinit var promise: PromiseMock

  private lateinit var module: WebBrowserModule

  @Before
  fun initializeMock() {
    promise = PromiseMock()
    module = WebBrowserModule(mockk())
  }

  @Test
  fun testOpenBrowserAsync() {
    // given
    val mock = mockkCustomTabsActivitiesHelper()
    every { mock.canResolveIntent(any()) } returns true
    initialize(mock)

    // when
    module.openBrowserAsync("http://expo.io", browserArguments(), promise)

    // then
    promiseResolved(promise) {
      assertSetsEqual(setOf("type"), it.keySet())
      assertEquals("opened", it.getString("type"))
    }
  }

  @Test
  fun `test browser not opened when no resolving activity found`() {
    // given
    val mock = mockkCustomTabsActivitiesHelper()
    every { mock.canResolveIntent(any()) } returns false
    initialize(mock)

    // when
    module.openBrowserAsync("http://expo.io", browserArguments(), promise)

    // then
    promiseRejected(promise) {
      assertTrue(it.rejectCodeSet)
      assertEquals(it.rejectCode, "EXWebBrowser")
      assertTrue(it.rejectMessageSet)
      assertEquals(it.rejectMessage, "No matching activity!")
    }
  }

  @Test
  fun `test no exception thrown when no package manager found`() {
    // given
    val mock = mockkCustomTabsActivitiesHelper()
    every { mock.canResolveIntent(any()) } throws PackageManagerNotFoundException()
    initialize(mock)

    // when
    module.openBrowserAsync("http://expo.io", browserArguments(), promise)

    // then
    promiseRejected(promise) {
      assertFalse(it.rejectCodeSet)
      assertFalse(it.rejectMessageSet)
      assertTrue(it.rejectThrowableSet)
      assertTrue(it.rejectThrowable is PackageManagerNotFoundException)
    }
  }

  @Test
  fun testArgumentsCorrectlyPassedToIntent() {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      browserArguments(
        toolbarColor = "#000000",
        browserPackage = "com.browser.package",
        enableBarCollapsing = true,
        enableDefaultShareMenuItem = true,
        showInRecents = true,
        createTask = true,
        showTitle = true
      ),
      promise
    )

    intentSlot.captured.let {
      assertEquals("com.browser.package", it.`package`)
    }
  }

  @Test
  fun testTrueFlagsCorrectlyPassedToIntent() {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      browserArguments(
        toolbarColor = "#000000",
        browserPackage = "com.browser.package",
        enableBarCollapsing = true,
        enableDefaultShareMenuItem = true,
        showInRecents = true,
        showTitle = true
      ),
      promise
    )

    intentSlot.captured.let {
      assertTrue(it.hasExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING))
      assertTrue(it.getBooleanExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, false))
      assertTrue((it.flags and Intent.FLAG_ACTIVITY_NEW_TASK) > 0)
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS) > 0)
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_NO_HISTORY) > 0)
    }
  }

  @Test
  fun testFalseFlagsCorrectlyPassedToIntent() {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      browserArguments(
        toolbarColor = "#000000",
        browserPackage = "com.browser.package",
        enableBarCollapsing = false,
        enableDefaultShareMenuItem = false,
        showInRecents = false,
        showTitle = false
      ),
      promise
    )

    intentSlot.captured.let {
      assertFalse(it.getBooleanExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, true))
      assertTrue((it.flags and Intent.FLAG_ACTIVITY_NEW_TASK) > 0)
      assertTrue((it.flags and Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS) > 0)
      assertTrue((it.flags and Intent.FLAG_ACTIVITY_NO_HISTORY) > 0)
    }
  }

  @Test
  fun testCreateTaskFalseCorrectlyPassedToIntent() {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      browserArguments(
        toolbarColor = "#000000",
        browserPackage = "com.browser.package",
        createTask = false
      ),
      promise
    )

    intentSlot.captured.let {
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_NEW_TASK) > 0)
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS) > 0)
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_NO_HISTORY) > 0)
    }
  }

  @Test
  fun testActivitiesAndServicesReturnedForValidKeys() {
    // given
    val services = arrayListOf("service1", "service2")
    val activities = arrayListOf("activity1", "activity2")
    initialize(mockkCustomTabsActivitiesHelper(services, activities))

    // when
    module.getCustomTabsSupportingBrowsersAsync(promise)

    // then
    promiseResolved(promise) {
      assertSetsEqual(setOf("browserPackages", "servicePackages", "preferredBrowserPackage", "defaultBrowserPackage"), it.keySet())
      assertListsEqual(activities, it.getStringArrayList("browserPackages"))
      assertListsEqual(services, it.getStringArrayList("servicePackages"))
      assertStringValueNull(it, "preferredBrowserPackage")
      assertStringValueNull(it, "defaultBrowserPackage")
    }
  }

  @Test
  fun testActivitiesAndServicesWorkForNulls() {
    // given
    initialize()

    // when
    module.getCustomTabsSupportingBrowsersAsync(promise)

    // then
    promiseResolved(promise) {
      assertSetsEqual(setOf("browserPackages", "servicePackages", "preferredBrowserPackage", "defaultBrowserPackage"), it.keySet())
      assertListsEqual(emptyList<String>(), it.getStringArrayList("browserPackages"))
      assertListsEqual(emptyList<String>(), it.getStringArrayList("servicePackages"))
      assertStringValueNull(it, "preferredBrowserPackage")
      assertStringValueNull(it, "defaultBrowserPackage")
    }
  }

  @Test
  fun testWarmUpWithGivenPackage() {
    // given
    val connectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
    initialize(customTabsConnectionHelper = connectionHelper)

    // when
    module.warmUpAsync("com.browser.package", promise)

    // then
    verify(exactly = 1) {
      connectionHelper.warmUp(any())
    }
    verify {
      connectionHelper.warmUp(eq("com.browser.package"))
    }
  }

  @Test
  fun testWarmUpWithoutPackage() {
    // given
    val connectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
    val customTabsHelper = mockkCustomTabsActivitiesHelper(preferredActivity = "com.browser.package")
    initialize(customTabsConnectionHelper = connectionHelper, customTabsActivitiesHelper = customTabsHelper)

    // when
    module.warmUpAsync(null, promise)

    // then
    verify(exactly = 1) {
      connectionHelper.warmUp(any())
    }
    verify {
      connectionHelper.warmUp(eq("com.browser.package"))
    }
  }

  @Test
  fun testCoolDownWithGivenPackage() {
    // given
    val connectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
    initialize(customTabsConnectionHelper = connectionHelper)

    // when
    module.coolDownAsync("com.browser.package", promise)

    // then
    verify(exactly = 1) {
      connectionHelper.coolDown(any())
    }
    verify {
      connectionHelper.coolDown(eq("com.browser.package"))
    }
  }

  @Test
  fun testCoolDownWithoutPackage() {
    // given
    val connectionHelper: CustomTabsConnectionHelper = mockkInternalModule(relaxed = true)
    val customTabsHelper = mockkCustomTabsActivitiesHelper(preferredActivity = "com.browser.package")
    initialize(customTabsConnectionHelper = connectionHelper, customTabsActivitiesHelper = customTabsHelper)

    // when
    module.coolDownAsync(null, promise)

    // then
    verify(exactly = 1) {
      connectionHelper.coolDown(any())
    }
    verify {
      connectionHelper.coolDown(eq("com.browser.package"))
    }
  }

  private fun initialize(
    customTabsActivitiesHelper: CustomTabsActivitiesHelper = mockkCustomTabsActivitiesHelper(),
    customTabsConnectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
  ) {
    moduleRegistry.mockInternalModule(customTabsConnectionHelper)
    moduleRegistry.mockInternalModule(customTabsActivitiesHelper)
    module.onCreate(moduleRegistry)
  }
}
