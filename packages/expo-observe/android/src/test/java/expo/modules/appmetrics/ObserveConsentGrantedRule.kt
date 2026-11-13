package expo.modules.appmetrics

import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkObject
import org.junit.rules.ExternalResource

// Consent is not granted until the start hook runs, and unit tests do not run it.
class ObserveConsentGrantedRule : ExternalResource() {
  override fun before() {
    mockkObject(ObserveConsent)
    every { ObserveConsent.isGranted } returns true
  }

  override fun after() {
    unmockkObject(ObserveConsent)
  }
}
