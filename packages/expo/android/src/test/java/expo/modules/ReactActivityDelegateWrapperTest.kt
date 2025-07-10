package expo.modules

import android.content.Context
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.google.common.truth.Truth.assertThat
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import io.mockk.MockKAnnotations
import io.mockk.every
import io.mockk.impl.annotations.RelaxedMockK
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.Test

internal class ReactActivityDelegateWrapperTest {
  private lateinit var mockPackage0: MockPackage

  private lateinit var mockPackage1: MockPackage

  @RelaxedMockK
  lateinit var activity: ReactActivity

  @RelaxedMockK
  lateinit var delegate: ReactActivityDelegate

  @Before
  fun setUp() {
    mockPackage0 = MockPackage()
    mockPackage1 = MockPackage()
    MockKAnnotations.init(this)
    mockkObject(ExpoModulesPackage.Companion)
    every { ExpoModulesPackage.Companion.packageList } returns listOf(mockPackage0, mockPackage1)
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `onBackPressed should call each handler's callback just once`() {
    val delegateWrapper = ReactActivityDelegateWrapper(activity, delegate)
    delegateWrapper.setLoadAppReadyForTesting()
    every { mockPackage0.reactActivityLifecycleListener.onBackPressed() } returns true

    delegateWrapper.onBackPressed()

    verify(exactly = 1) { mockPackage0.reactActivityLifecycleListener.onBackPressed() }
    verify(exactly = 1) { mockPackage1.reactActivityLifecycleListener.onBackPressed() }
    verify(exactly = 1) { delegate.onBackPressed() }
  }

  @Test
  fun `onBackPressed should return true if someone returns true`() {
    val delegateWrapper = ReactActivityDelegateWrapper(activity, delegate)
    delegateWrapper.setLoadAppReadyForTesting()
    every { mockPackage0.reactActivityLifecycleListener.onBackPressed() } returns false
    every { mockPackage1.reactActivityLifecycleListener.onBackPressed() } returns true
    every { delegate.onBackPressed() } returns false

    val result = delegateWrapper.onBackPressed()
    assertThat(result).isTrue()
  }

  @Test
  fun `onNewIntent should call each handler's callback just once`() {
    val intent = mockk<Intent>()
    val delegateWrapper = ReactActivityDelegateWrapper(activity, delegate)
    delegateWrapper.setLoadAppReadyForTesting()
    every { mockPackage0.reactActivityLifecycleListener.onNewIntent(intent) } returns false
    every { mockPackage1.reactActivityLifecycleListener.onNewIntent(intent) } returns true
    every { delegate.onNewIntent(intent) } returns false

    delegateWrapper.onNewIntent(intent)

    verify(exactly = 1) { mockPackage0.reactActivityLifecycleListener.onNewIntent(any()) }
    verify(exactly = 1) { mockPackage1.reactActivityLifecycleListener.onNewIntent(any()) }
    verify(exactly = 1) { delegate.onNewIntent(any()) }
  }

  @Test
  fun `onNewIntent should return true if someone returns true`() {
    val intent = mockk<Intent>()
    val delegateWrapper = ReactActivityDelegateWrapper(activity, delegate)
    delegateWrapper.setLoadAppReadyForTesting()
    every { mockPackage0.reactActivityLifecycleListener.onNewIntent(intent) } returns false
    every { mockPackage1.reactActivityLifecycleListener.onNewIntent(intent) } returns true
    every { delegate.onNewIntent(intent) } returns false

    val result = delegateWrapper.onNewIntent(intent)
    assertThat(result).isTrue()
  }
}

internal class MockPackage : Package {
  val reactActivityLifecycleListener = mockk<ReactActivityLifecycleListener>(relaxed = true)
  private val reactActivityHandler = mockk<ReactActivityHandler>(relaxed = true)

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    return listOf(reactActivityLifecycleListener)
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    return listOf(reactActivityHandler)
  }
}
