package expo.modules.appmetrics

import org.junit.Assert.assertFalse
import org.junit.Test

// No Robolectric runner, so the Robolectric tests that call `load` change a different copy of `ObserveConsent`.
class ObserveConsentDefaultTest {
  @Test
  fun `consent is not granted before load`() {
    assertFalse(ObserveConsent.isGranted)
  }

  @Test
  fun `consent is not loaded before load`() {
    assertFalse(ObserveConsent.isLoaded)
  }
}
