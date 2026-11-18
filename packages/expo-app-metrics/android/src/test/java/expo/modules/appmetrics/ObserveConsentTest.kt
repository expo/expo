package expo.modules.appmetrics

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ObserveConsentTest {
  private fun appConfig(consent: String) = """{"extra":{"eas":{"observe":{"consent":$consent}}}}"""

  @Test
  fun `app config without the consent key grants consent`() {
    assertTrue(ObserveConsent.resolve(null))
    assertTrue(ObserveConsent.resolve("""{"extra":{"eas":{"projectId":"id"}}}"""))
    assertTrue(ObserveConsent.resolve("not json"))
  }

  @Test
  fun `consent key granted grants consent`() {
    assertTrue(ObserveConsent.resolve(appConfig("\"granted\"")))
  }

  @Test
  fun `consent key not-granted denies consent`() {
    assertFalse(ObserveConsent.resolve(appConfig("\"not-granted\"")))
  }

  @Test
  fun `unknown consent value denies consent`() {
    assertFalse(ObserveConsent.resolve(appConfig("\"pending\"")))
    assertFalse(ObserveConsent.resolve(appConfig("false")))
  }
}
