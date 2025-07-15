package expo.modules

import android.app.Activity
import android.app.Application
import android.content.Context
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactRootView
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.soloader.SoLoader
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityHandler.DelayLoadAppHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.RelaxedMockK
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.spyk
import io.mockk.unmockkAll
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(application = MockApplication::class)
internal class ReactActivityDelegateWrapperDelayLoadTest {
  @RelaxedMockK
  private lateinit var delayLoadAppHandler: DelayLoadAppHandler

  private lateinit var mockPackageWithDelay: MockPackageWithDelayHandler
  private lateinit var mockPackageWithoutDelay: MockPackageWithoutDelayHandler
  private lateinit var activityController: ActivityController<MockActivity>
  private val activity: MockActivity
    get() = activityController.get()

  @OptIn(ExperimentalCoroutinesApi::class)
  @Before
  fun setUp() {
    SoLoader.setInTestMode()
    mockkObject(ExpoModulesPackage.Companion)
    mockkStatic(ReactNativeFeatureFlags::class)
    every { ReactNativeFeatureFlags.enableBridgelessArchitecture() } returns true
    every { ReactNativeFeatureFlags.enableFabricRenderer() } returns true
    Dispatchers.setMain(UnconfinedTestDispatcher())

    MockKAnnotations.init(this)

    mockPackageWithDelay = MockPackageWithDelayHandler(delayLoadAppHandler)
    mockPackageWithoutDelay = MockPackageWithoutDelayHandler()
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `should proceed loadApp immediately when no delayLoadAppHandler`() = runTest {
    every { ExpoModulesPackage.Companion.packageList } returns listOf(mockPackageWithoutDelay)

    activityController = Robolectric.buildActivity(MockActivity::class.java)
      .also {
        val activity = it.get()
        (activity.application as MockApplication).bindCurrentActivity(activity)
      }
      .setup()
    val spyDelegateWrapper = activity.reactActivityDelegate as ReactActivityDelegateWrapper
    verify { spyDelegateWrapper.invokeDelegateMethod("loadApp", arrayOf(String::class.java), arrayOf("main")) }
  }

  @Test
  fun `should block loadApp until delayLoadAppHandler finished`() = runTest {
    every { ExpoModulesPackage.Companion.packageList } returns listOf(mockPackageWithDelay)

    val callbackSlot = slot<Runnable>()
    every { delayLoadAppHandler.whenReady(capture(callbackSlot)) } answers {
      // Don't call the callback immediately to simulate delay
    }

    activityController = Robolectric.buildActivity(MockActivity::class.java)
      .also {
        val activity = it.get()
        (activity.application as MockApplication).bindCurrentActivity(activity)
      }
      .setup()

    val spyDelegateWrapper = activity.reactActivityDelegate as ReactActivityDelegateWrapper

    verify(exactly = 0) { spyDelegateWrapper.invokeDelegateMethod("loadApp", arrayOf(String::class.java), arrayOf("main")) }
    callbackSlot.captured.run()
    verify(exactly = 1) { spyDelegateWrapper.invokeDelegateMethod("loadApp", arrayOf(String::class.java), arrayOf("main")) }
  }

  @Test
  fun `should call lifecycle methods in correct order with delay load`() = runTest {
    every { ExpoModulesPackage.Companion.packageList } returns listOf(mockPackageWithDelay)

    val callbackSlot = slot<Runnable>()
    every { delayLoadAppHandler.whenReady(capture(callbackSlot)) } answers {
      // Don't call the callback immediately to simulate delay
    }

    activityController = Robolectric.buildActivity(MockActivity::class.java)
      .also {
        val activity = it.get()
        (activity.application as MockApplication).bindCurrentActivity(activity)
      }
      .setup()
    val spyDelegateWrapper = activity.reactActivityDelegate as ReactActivityDelegateWrapper
    val spyDelegate = spyDelegateWrapper.delegate

    verify(exactly = 1) { spyDelegateWrapper.onCreate(any()) }
    verify(exactly = 1) { spyDelegateWrapper.onResume() }
    verify(exactly = 0) { spyDelegate.onResume() }

    callbackSlot.captured.run()
    verify(exactly = 1) { spyDelegateWrapper.onResume() }
    verify(exactly = 1) { spyDelegate.onResume() }
    verify(exactly = 0) { spyDelegateWrapper.onPause() }
    verify(exactly = 0) { spyDelegateWrapper.onDestroy() }
    verify(exactly = 0) { spyDelegate.onPause() }
    verify(exactly = 0) { spyDelegate.onDestroy() }

    activityController.pause().stop().destroy()
    verify(exactly = 1) { spyDelegateWrapper.onPause() }
    verify(exactly = 1) { spyDelegateWrapper.onDestroy() }
    verify(exactly = 1) { spyDelegate.onPause() }
    verify(exactly = 1) { spyDelegate.onDestroy() }
  }

  @Test
  fun `should have normal lifecycle when no delayLoadHandler`() = runTest {
    every { ExpoModulesPackage.Companion.packageList } returns listOf(mockPackageWithoutDelay)

    activityController = Robolectric.buildActivity(MockActivity::class.java)
      .also {
        val activity = it.get()
        (activity.application as MockApplication).bindCurrentActivity(activity)
      }
      .setup()
    val spyDelegateWrapper = activity.reactActivityDelegate as ReactActivityDelegateWrapper
    val spyDelegate = spyDelegateWrapper.delegate

    verify(exactly = 1) { spyDelegateWrapper.onCreate(any()) }
    verify(exactly = 1) { spyDelegateWrapper.onResume() }
    verify(exactly = 1) { spyDelegate.onResume() }

    activityController.pause().stop().destroy()
    verify(exactly = 1) { spyDelegateWrapper.onPause() }
    verify(exactly = 1) { spyDelegateWrapper.onDestroy() }
    verify(exactly = 1) { spyDelegate.onPause() }
    verify(exactly = 1) { spyDelegate.onDestroy() }
  }

  @Test
  fun `should cancel pending resume if activity destroy before delay load finished`() = runTest {
    every { ExpoModulesPackage.Companion.packageList } returns listOf(mockPackageWithDelay)

    val callbackSlot = slot<Runnable>()
    every { delayLoadAppHandler.whenReady(capture(callbackSlot)) } answers {
      // Don't call the callback immediately to simulate delay
    }

    activityController = Robolectric.buildActivity(MockActivity::class.java)
      .also {
        val activity = it.get()
        (activity.application as MockApplication).bindCurrentActivity(activity)
      }
      .setup()
    val spyDelegateWrapper = activity.reactActivityDelegate as ReactActivityDelegateWrapper
    val spyDelegate = spyDelegateWrapper.delegate

    verify(exactly = 1) { spyDelegateWrapper.onCreate(any()) }
    verify(exactly = 1) { spyDelegateWrapper.onResume() }
    verify(exactly = 0) { spyDelegate.onResume() }

    activityController.pause().stop().destroy()
    callbackSlot.captured.run()
    verify(exactly = 0) { spyDelegate.onResume() }
  }
}

internal class MockPackageWithDelayHandler(delayHandler: DelayLoadAppHandler) : Package {
  private val reactActivityLifecycleListener = mockk<ReactActivityLifecycleListener>(relaxed = true)
  private val reactActivityHandler = mockk<ReactActivityHandler>(relaxed = true)

  init {
    every { reactActivityHandler.createReactRootViewContainer(any()) } returns null
    every { reactActivityHandler.onDidCreateReactActivityDelegate(any(), any()) } returns null
    every { reactActivityHandler.getDelayLoadAppHandler(any(), any()) } returns delayHandler
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    return listOf(reactActivityLifecycleListener)
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    return listOf(reactActivityHandler)
  }
}

internal class MockPackageWithoutDelayHandler : Package {
  private val reactActivityLifecycleListener = mockk<ReactActivityLifecycleListener>(relaxed = true)
  private val reactActivityHandler = mockk<ReactActivityHandler>(relaxed = true)

  init {
    every { reactActivityHandler.createReactRootViewContainer(any()) } returns null
    every { reactActivityHandler.onDidCreateReactActivityDelegate(any(), any()) } returns null
    every { reactActivityHandler.getDelayLoadAppHandler(any(), any()) } returns null
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    return listOf(reactActivityLifecycleListener)
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    return listOf(reactActivityHandler)
  }
}

internal class MockApplication : Application(), ReactApplication {
  private var currentActivity: Activity? = null

  override fun onCreate() {
    super.onCreate()
    setTheme(androidx.appcompat.R.style.Theme_AppCompat)
  }

  internal fun bindCurrentActivity(activity: Activity?) {
    currentActivity = activity
  }

  override val reactNativeHost: ReactNativeHost = mockk<ReactNativeHost>(relaxed = true)

  override val reactHost: ReactHost by lazy {
    mockk<ReactHost>(relaxed = true)
      .also {
        val mockReactSurface = mockk<ReactSurface>(relaxed = true)
        every { mockReactSurface.view } returns ReactRootView(currentActivity)
        every { it.createSurface(any(), any(), any()) } returns mockReactSurface
      }
  }
}

internal class MockActivity : ReactActivity() {
  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate = spyk(
    ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      spyk(
        object : DefaultReactActivityDelegate(
          this,
          mainComponentName,
          fabricEnabled
        ) {}
      )
    )
  )
}
