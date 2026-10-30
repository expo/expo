package host.exp.exponent.home

import host.exp.exponent.services.ActorType
import host.exp.exponent.services.SessionsState
import host.exp.exponent.services.StoredAccount

data class AccountSwitcherRow(
  val sessionId: String,
  val account: StoredAccount,
  val isSelected: Boolean
)

data class AccountSwitcherSection(
  val sessionId: String,
  val username: String,
  val isActive: Boolean,
  val isPartner: Boolean,
  val rows: List<AccountSwitcherRow>
)

object AccountSwitcherSections {
  fun make(state: SessionsState): List<AccountSwitcherSection> =
    state.sessions
      .sortedByDescending { it.id == state.activeSessionId }
      .map { session ->
        val isActive = session.id == state.activeSessionId
        val isPersonal = { account: StoredAccount -> session.userId != null && account.ownerUserId == session.userId }
        AccountSwitcherSection(
          sessionId = session.id,
          username = session.username ?: session.displayName ?: "",
          isActive = isActive,
          isPartner = session.actorType == ActorType.Partner,
          rows = session.accounts
            .sortedByDescending(isPersonal)
            .map { AccountSwitcherRow(session.id, it, isActive && it.id == session.selectedAccountId) }
        )
      }
}
