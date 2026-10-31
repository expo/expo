package expo.modules.webbrowser

import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.errorCodeOf
import expo.modules.test.core.legacy.assertCodedException
import io.mockk.every
import io.mockk.slot
import io.mockk.spyk
import io.mockk.verify
import junit.framework.ComparisonFailure
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

import org.robolectric.RobolectricTestRunner

private fun assertListsEqual(first: List<*>?, second: List<*>?, message: String = "") {
  if (first == second) {
    return
  }

  if (first == null || second == null) {
    throw throw ComparisonFailure(message, first.toString(), second.toString())
  }

  if (!first.toTypedArray().contentDeepEquals(second.toTypedArray())) {
    throw ComparisonFailure(message, first.toString(), second.toString())
  }
}

/** Calls the module's suspend exports the way JavaScript would. */
private class WebBrowserModuleTestWrapper(private val module: WebBrowserModule) {
  @Throws(CodedException::class)
  fun openBrowserAsync(url: String, options: OpenBrowserOptions): OpenBrowserResult =
    runBlocking { module.openBrowserAsync(url, options) }

  fun getCustomTabsSupportingBrowsersAsync(): CustomTabsBrowsersResult =
    runBlocking { module.getCustomTabsSupportingBrowsersAsync() }

  fun warmUpAsync(browserPackage: String?): Map<String, String> =
    runBlocking { module.warmUpAsync(browserPackage) }

  fun coolDownAsync(browserPackage: String?): Map<String, String> =
    runBlocking { module.coolDownAsync(browserPackage) }
}

private class WebBrowserModuleMock(val moduleSpy: WebBrowserModule) {
  val module = WebBrowserModuleTestWrapper(moduleSpy)
}

private inline fun withWebBrowserMock(block: WebBrowserModuleMock.() -> Unit) =
  WebBrowserModuleMock(spyk(WebBrowserModule())).block()

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
    assertEquals("opened", result.type)
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
    val intentSlot = slot<CustomTabsIntent>()
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

    assertEquals("com.browser.package", intentSlot.captured.intent.`package`)
  }

  @Test
  fun testToolbarColorsCorrectlyPassedToIntent() = withWebBrowserMock {
    // given
    val toolbarColor = 0xFF361030.toInt()
    val secondaryToolbarColor = 0xFF1B5E20.toInt()
    val intentSlot = slot<CustomTabsIntent>()
    val mock = mockkCustomTabsActivitiesHelper(defaultCanResolveIntent = true, startIntentSlot = intentSlot)
    initialize(moduleSpy, customTabsActivitiesHelper = mock)

    // when
    module.openBrowserAsync(
      "http://expo.io",
      OpenBrowserOptions(
        toolbarColor = toolbarColor,
        secondaryToolbarColor = secondaryToolbarColor
      )
    )

    // then
    val colorSchemeParams = CustomTabsIntent.getColorSchemeParams(
      intentSlot.captured.intent,
      CustomTabsIntent.COLOR_SCHEME_LIGHT
    )
    assertEquals(toolbarColor, colorSchemeParams.toolbarColor)
    assertEquals(secondaryToolbarColor, colorSchemeParams.secondaryToolbarColor)
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
      assertListsEqual(activities, it.browserPackages)
      assertListsEqual(services, it.servicePackages)
      assertEquals(null, it.preferredBrowserPackage)
      assertEquals(null, it.defaultBrowserPackage)
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
      assertListsEqual(emptyList<String>(), it.browserPackages)
      assertListsEqual(emptyList<String>(), it.servicePackages)
      assertEquals(null, it.preferredBrowserPackage)
      assertEquals(null, it.defaultBrowserPackage)
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
