package host.exp.exponent.home.auth

import host.exp.exponent.services.SessionsState

/** A stored secret can belong to the browser's expo.dev session, and signing in as another user there ends it. */
fun usesEphemeralBrowserSession(state: SessionsState): Boolean = state.sessions.isNotEmpty()
