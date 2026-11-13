package host.exp.exponent.home.auth

import host.exp.exponent.services.SessionsState
import host.exp.exponent.services.StoredSession
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BrowserLoginSessionTest {
  @Test
  fun firstSignInSharesTheBrowserSession() {
    assertFalse(usesEphemeralBrowserSession(SessionsState()))
  }

  @Test
  fun addingAnAccountUsesAnEphemeralBrowserSession() {
    val state = SessionsState(listOf(StoredSession(id = "s1", sessionSecret = "a")), activeSessionId = "s1")

    assertTrue(usesEphemeralBrowserSession(state))
  }

  @Test
  fun anInactiveStoredSessionStillNeedsAnEphemeralBrowserSession() {
    val state = SessionsState(listOf(StoredSession(id = "s1", sessionSecret = "a")), activeSessionId = null)

    assertTrue(usesEphemeralBrowserSession(state))
  }
}
