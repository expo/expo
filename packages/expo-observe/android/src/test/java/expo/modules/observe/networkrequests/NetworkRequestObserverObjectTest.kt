package expo.modules.observe.networkrequests

import expo.modules.kotlin.AppContext
import io.mockk.mockk
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkRequestObserverObjectTest {
  @Test
  fun `release stops the observer`() {
    val sharedObject = NetworkRequestObserverObject(mockk<AppContext>(relaxed = true), filter = null)
    assertTrue(sharedObject.observer.shouldObserveRequest("https://expo.dev", "GET"))

    sharedObject.sharedObjectDidRelease()

    assertFalse(sharedObject.observer.shouldObserveRequest("https://expo.dev", "GET"))
  }
}
