package expo.modules.webbrowser

import android.os.Bundle
import android.os.putStringArrayLists
import android.os.putStrings
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
//import org.robolectric.RobolectricTestRunner
import org.unimodules.core.arguments.ReadableArguments
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.PromiseState
import org.unimodules.test.core.assertListsEqual
import org.unimodules.test.core.assertSetsEqual
import org.unimodules.test.core.mockInternalModule
import org.unimodules.test.core.mockPromise
import org.unimodules.test.core.moduleRegistryMock
import org.unimodules.test.core.promiseResolved
import org.unimodules.test.core.readableArgumentsOf
import kotlin.collections.ArrayList

@RunWith(JUnit4::class)
internal class WebBrowserModuleTest {

  private var moduleRegistry = moduleRegistryMock()

  private lateinit var promise: PromiseMock

  private lateinit var module: WebBrowserModule

  @Before
  fun initializeMock() {
    promise = mockPromise()
    module = WebBrowserModule(mockk())
  }

  @Test
  fun openBrowserAsync() {
//    // given
//    initialize()
//
//    // when
//    module.openBrowserAsync("http://expo.io", browserArguments(), promise)
//
//    // then
//    promiseResolved(promise).let {
//      assertSetsEqual(setOf("type"), it.keySet())
//      assertEquals("opened", it.putStrings["type"])
//    }
  }

  @Test
  fun testParametersCorrectlyPassedToIntent() {
  }

  @Test
  fun warmUpAsync() {
  }

  @Test
  fun coolDownAsync() {
  }

  @Test
  fun testActivitiesAndServicesReturnedForValidKeys() {
    // given
    val services = arrayListOf("service1", "service2")
    val activities = arrayListOf("activity1", "activity2")
    initialize(mockCustomTabsActivitiesHelper(services, activities))

    // when
    module.getCustomTabsSupportingBrowsersAsync(promise)

    // then
    assertEquals(PromiseState.RESOLVED, promise.state)
    assertTrue(promise.resolveValue is Bundle)
    (promise.resolveValue as Bundle).let {
      assertSetsEqual(setOf("browserPackages", "servicePackages", "preferredBrowserPackage", "defaultBrowserPackage"), it.keySet())
      assertListsEqual(activities, it.putStringArrayLists["browserPackages"]!!)
      assertListsEqual(services, it.putStringArrayLists["servicePackages"]!!)
      assertEquals(null, it.putStrings["preferredBrowserPackage"])
      assertEquals(null, it.putStrings["defaultBrowserPackage"])
    }
  }

  @Test
  fun testActivitiesAndServicesWorkForNulls() {
    // given
    initialize()

    // when
    module.getCustomTabsSupportingBrowsersAsync(promise)

    // then
    assertEquals(PromiseState.RESOLVED, promise.state)
    assertTrue(promise.resolveValue is Bundle)
    (promise.resolveValue as Bundle).let {
      assertSetsEqual(setOf("browserPackages", "servicePackages", "preferredBrowserPackage", "defaultBrowserPackage"), it.keySet())
      assertListsEqual(emptyList<String>(), it.putStringArrayLists["browserPackages"]!!)
      assertListsEqual(emptyList<String>(), it.putStringArrayLists["servicePackages"]!!)
      assertEquals(null, it.putStrings["preferredBrowserPackage"])
      assertEquals(null, it.putStrings["defaultBrowserPackage"])
    }
  }

  private fun browserArguments(
    toolbarColor: String = "#000000",
    browserPackage: String = "com.browser",
    enableBarCollapsing: Boolean = true,
    showTitle: Boolean = true,
    enableDefaultShareMenuItem: Boolean = true,
    showInRecents: Boolean = true
  ): ReadableArguments {
    // Move creation of readable arguments to TestUtils
    return readableArgumentsOf(mapOf(
      "toolbarColor" to toolbarColor,
      "browserPackage" to browserPackage,
      "enableBarCollapsing" to enableBarCollapsing,
      "showTitle" to showTitle,
      "enableDefaultShareMenuItem" to enableDefaultShareMenuItem,
      "showInRecents" to showInRecents
    ))
  }

  private fun initialize(customTabsActivitiesHelper: InternalCustomTabsActivitiesHelper = mockCustomTabsActivitiesHelper()) {
    moduleRegistry.mockInternalModule(customTabsActivitiesHelper)
    module.onCreate(moduleRegistry)
  }

  private fun mockCustomTabsActivitiesHelper(
    services: ArrayList<String> = ArrayList(),
    activities: ArrayList<String> = ArrayList(),
    preferredActivity: String? = null,
    defaultActivity: String? = null):
    InternalCustomTabsActivitiesHelper {
    val customTabsActivitiesHelper: InternalCustomTabsActivitiesHelper = spyk()
    every { customTabsActivitiesHelper.customTabsResolvingActivities } returns activities
    every { customTabsActivitiesHelper.customTabsResolvingServices } returns services
    every { customTabsActivitiesHelper.getPreferredCustomTabsResolvingActivity(any()) } returns preferredActivity
    every { customTabsActivitiesHelper.defaultCustomTabsResolvingActivity } returns defaultActivity
    return customTabsActivitiesHelper
  }
}