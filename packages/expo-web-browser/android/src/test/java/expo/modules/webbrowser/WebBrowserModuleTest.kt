package expo.modules.webbrowser

import android.content.Intent
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.errorCodeOf
import expo.modules.test.core.legacy.ModuleMock
import expo.modules.test.core.legacy.ModuleMockHolder
import expo.modules.test.core.legacy.assertCodedException
import io.mockk.every
import io.mockk.slot
import io.mockk.verify
import junit.framework.ComparisonFailure
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

import org.robolectric.RobolectricTestRunner

private fun assertSetsEqual(first: Set<*>, second: Set<*>, message: String = "") {
  if (!first.all { second.contains(it) }) {
    throw ComparisonFailure(message, first.toString(), second.toString())
  }
}

private fun assertStringValueNull(bundle: Bundle, key: String) {
  assertTrue(bundle.containsKey(key))
  assertEquals(null, bundle.getString(key))
}

private fun assertListsEqual(first: List<*>?, second: List<*>?, message: String = "") {
  if (first == second) return

  if (first == null || second == null) {
    throw throw ComparisonFailure(message, first.toString(), second.toString())
  }

  if (!first.toTypedArray().contentDeepEquals(second.toTypedArray())) {
    throw ComparisonFailure(message, first.toString(), second.toString())
  }
}

private interface WebBrowserModuleTestInterface {
  @Throws(CodedException::class)
  fun openBrowserAsync(url: String, options: OpenBrowserOptions): Bundle

  fun getCustomTabsSupportingBrowsersAsync(): Bundle

  fun warmUpAsync(browserPackage: String?): Bundle

  fun coolDownAsync(browserPackage: String?): Bundle

  fun mayInitWithUrlAsync(url: String, browserPackage: String?): Bundle
}

private inline fun withWebBrowserMock(
  block: ModuleMockHolder<WebBrowserModuleTestInterface, WebBrowserModule>.() -> Unit
) = ModuleMock.createMock(
  WebBrowserModuleTestInterface::class,
  WebBrowserModule(),
  block = block,
  autoOnCreate = false
)

@RunWith(RobolectricTestRunner::class)
internal class WebBrowserModuleTest {

  @Test
  fun testOpenBrowserAsync() = withWebBrowserMock {
    // given
    val mock = mockkCustomTabsActivitiesHelper()
    every { mock.canResolveIntent(any()) } returns true
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    val result = module.openBrowserAsync("http://expo.dev", OpenBrowserOptions())

    // then
    result.let {
      assertSetsEqual(setOf("type"), it.keySet())
      assertEquals("opened", it.getString("type"))
    }
  }

  @Test
  fun `test browser not opened when no resolving activity found`() = withWebBrowserMock {
    // given
    val mock = mockkCustomTabsActivitiesHelper()
    every { mock.canResolveIntent(any()) } returns false
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    val exception = runCatching {
      module.openBrowserAsync("http://expo.dev", OpenBrowserOptions())
    }.exceptionOrNull()

    // then
    assertCodedException(exception) {
      assertEquals(errorCodeOf<NoMatchingActivityException>(), it.code)
    }
  }

  @Test
  fun `test no exception thrown when no package manager found`() = withWebBrowserMock {
    // given
    val mock = mockkCustomTabsActivitiesHelper()
    every { mock.canResolveIntent(any()) } throws PackageManagerNotFoundException()
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    val exception = runCatching {
      module.openBrowserAsync("http://expo.io", OpenBrowserOptions())
    }.exceptionOrNull()

    // then
    assertCodedException(exception) {
      assertEquals(errorCodeOf<PackageManagerNotFoundException>(), it.code)
    }
  }

  @Test
  fun testArgumentsCorrectlyPassedToIntent() = withWebBrowserMock {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      OpenBrowserOptions(
        toolbarColor = 0,
        browserPackage = "com.browser.package",
        enableBarCollapsing = true,
        enableDefaultShareMenuItem = true,
        showInRecents = true,
        shouldCreateTask = true,
        showTitle = true
      )
    )

    intentSlot.captured.let {
      assertEquals("com.browser.package", it.`package`)
    }
  }

  @Test
  fun testTrueFlagsCorrectlyPassedToIntent() = withWebBrowserMock {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      OpenBrowserOptions(
        toolbarColor = 0,
        browserPackage = "com.browser.package",
        enableBarCollapsing = true,
        enableDefaultShareMenuItem = true,
        showInRecents = true,
        showTitle = true
      )
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
  fun testFalseFlagsCorrectlyPassedToIntent() = withWebBrowserMock {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      OpenBrowserOptions(
        toolbarColor = 0,
        browserPackage = "com.browser.package",
        enableBarCollapsing = false,
        enableDefaultShareMenuItem = false,
        showInRecents = false,
        showTitle = false
      )
    )

    intentSlot.captured.let {
      assertFalse(it.getBooleanExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, true))
      assertTrue((it.flags and Intent.FLAG_ACTIVITY_NEW_TASK) > 0)
      assertTrue((it.flags and Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS) > 0)
      assertTrue((it.flags and Intent.FLAG_ACTIVITY_NO_HISTORY) > 0)
    }
  }

  @Test
  fun testCreateTaskFalseCorrectlyPassedToIntent() = withWebBrowserMock {
    // given
    val intentSlot = slot<Intent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      OpenBrowserOptions(
        toolbarColor = 0,
        browserPackage = "com.browser.package",
        shouldCreateTask = false
      )
    )

    intentSlot.captured.let {
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_NEW_TASK) > 0)
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS) > 0)
      assertFalse((it.flags and Intent.FLAG_ACTIVITY_NO_HISTORY) > 0)
    }
  }

  @Test
  fun testActivitiesAndServicesReturnedForValidKeys() = withWebBrowserMock {
    // given
    val services = arrayListOf("service1", "service2")
    val activities = arrayListOf("activity1", "activity2")
    initialize(moduleSpy, customTabsActivitiesHelper = mockkCustomTabsActivitiesHelper(services, activities))

    // when
    val result = module.getCustomTabsSupportingBrowsersAsync()

    // then
    result.let {
      assertSetsEqual(setOf("browserPackages", "servicePackages", "preferredBrowserPackage", "defaultBrowserPackage"), it.keySet())
      assertListsEqual(activities, it.getStringArrayList("browserPackages"))
      assertListsEqual(services, it.getStringArrayList("servicePackages"))
      assertStringValueNull(it, "preferredBrowserPackage")
      assertStringValueNull(it, "defaultBrowserPackage")
    }
  }

  @Test
  fun testActivitiesAndServicesWorkForNulls() = withWebBrowserMock {
    // given
    initialize(moduleSpy)

    // when
    val result = module.getCustomTabsSupportingBrowsersAsync()

    // then
    result.let {
      assertSetsEqual(setOf("browserPackages", "servicePackages", "preferredBrowserPackage", "defaultBrowserPackage"), it.keySet())
      assertListsEqual(emptyList<String>(), it.getStringArrayList("browserPackages"))
      assertListsEqual(emptyList<String>(), it.getStringArrayList("servicePackages"))
      assertStringValueNull(it, "preferredBrowserPackage")
      assertStringValueNull(it, "defaultBrowserPackage")
    }
  }

  @Test
  fun testWarmUpWithGivenPackage() = withWebBrowserMock {
    // given
    val connectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
    initialize(moduleSpy, customTabsConnectionHelper = connectionHelper)

    // when
    module.warmUpAsync(browserPackage = "com.browser.package")

    // then
    verify(exactly = 1) {
      connectionHelper.warmUp(any())
    }
    verify {
      connectionHelper.warmUp(eq("com.browser.package"))
    }
  }

  @Test
  fun testWarmUpWithoutPackage() = withWebBrowserMock {
    // given
    val connectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
    val customTabsHelper = mockkCustomTabsActivitiesHelper(preferredActivity = "com.browser.package")
    initialize(moduleSpy, customTabsConnectionHelper = connectionHelper, customTabsActivitiesHelper = customTabsHelper)

    // when
    module.warmUpAsync(browserPackage = null)

    // then
    verify(exactly = 1) {
      connectionHelper.warmUp(any())
    }
    verify {
      connectionHelper.warmUp(eq("com.browser.package"))
    }
  }

  @Test
  fun testCoolDownWithGivenPackage() = withWebBrowserMock {
    // given
    val connectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
    initialize(moduleSpy, customTabsConnectionHelper = connectionHelper)

    // when
    module.coolDownAsync(browserPackage = "com.browser.package")

    // then
    verify(exactly = 1) {
      connectionHelper.coolDown(any())
    }
    verify {
      connectionHelper.coolDown(eq("com.browser.package"))
    }
  }

  @Test
  fun testCoolDownWithoutPackage() = withWebBrowserMock {
    // given
    val connectionHelper = mockkCustomTabsConnectionHelper()
    val customTabsHelper = mockkCustomTabsActivitiesHelper(preferredActivity = "com.browser.package")
    initialize(moduleSpy, customTabsConnectionHelper = connectionHelper, customTabsActivitiesHelper = customTabsHelper)

    // when
    module.coolDownAsync(browserPackage = null)

    // then
    verify(exactly = 1) {
      connectionHelper.coolDown(any())
    }
    verify {
      connectionHelper.coolDown(eq("com.browser.package"))
    }
  }

  private fun initialize(
    moduleSpy: WebBrowserModule,
    customTabsActivitiesHelper: CustomTabsActivitiesHelper = mockkCustomTabsActivitiesHelper(),
    customTabsConnectionHelper: CustomTabsConnectionHelper = mockkCustomTabsConnectionHelper()
  ) {
    every { moduleSpy.customTabsResolver } returns customTabsActivitiesHelper
    every { moduleSpy.connectionHelper } returns customTabsConnectionHelper
  }
}
