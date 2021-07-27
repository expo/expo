package expo.modules.analytics.amplitude

import androidx.test.core.app.ApplicationProvider
import io.mockk.every
import io.mockk.mockk

import org.junit.runner.RunWith
import org.junit.Test
import org.junit.Assert.assertNull
import org.robolectric.RobolectricTestRunner

import expo.modules.core.arguments.ReadableArguments
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertRejected
import org.unimodules.test.core.assertResolved

@RunWith(RobolectricTestRunner::class)
internal class AmplitudeModuleTest {
  private lateinit var module: AmplitudeModule

  @Test
  fun `initializeAsync resolves promise`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    module.initializeAsync("testapikey", promise)
    assertResolved(promise)
  }

  @Test
  fun `setUserIdAsync rejects when module is not initialized`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    module.setUserIdAsync("testUserId", promise)
    assertRejected(promise)
  }

  @Test
  fun `setUserPropertiesAsync rejects when module is not initialized`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    module.setUserPropertiesAsync(
      mapOf(
        "property 1 key" to "property 1",
        "property 2 key" to "property 2",
      ),
      promise
    )
    assertRejected(promise)
  }

  @Test
  fun `clearUserPropertiesAsync rejects when module is not initialized`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    module.clearUserPropertiesAsync(promise)
    assertRejected(promise)
  }

  @Test
  fun `logEventAsync rejects when module is not initialized`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    module.logEventAsync("eventName", promise)
    assertRejected(promise)
  }

  @Test
  fun `logEventWithPropertiesAsync rejects when module is not initialized`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    module.logEventWithPropertiesAsync(
      eventName = "test eventName",
      properties = mapOf("property 1 key" to "property 1"),
      promise = promise
    )
    assertRejected(promise)
  }

  @Test
  fun `setGroupAsync rejects when module is not initialized`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    module.setGroupAsync(
      groupType = "test groupType",
      groupNames = listOf("test groupName 1"),
      promise = promise
    )
    assertRejected(promise)
  }

  @Test
  fun `setTrackingOptionsAsync resolves with null`() {
    module = AmplitudeModule(ApplicationProvider.getApplicationContext())
    val promise = PromiseMock()
    val mockReadableArguments = mockk<ReadableArguments>(relaxed = true)
    every { mockReadableArguments.getBoolean(any()) } returns true
    module.setTrackingOptionsAsync(mockReadableArguments, promise)
    assertResolved(promise)
    assertNull(promise.resolveValue)
  }
}
