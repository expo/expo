package host.exp.exponent.home

import host.exp.exponent.services.ActorType
import host.exp.exponent.services.SessionsState
import host.exp.exponent.services.StoredAccount
import host.exp.exponent.services.StoredSession
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AccountSwitcherSectionsTest {
  private fun account(id: String, ownerUserId: String?) = StoredAccount(id, id, ownerUserId, null, null, null)

  private fun session(
    id: String,
    userId: String,
    username: String,
    selectedAccountId: String? = null,
    actorType: ActorType = ActorType.User,
    accounts: List<StoredAccount> = emptyList()
  ) = StoredSession(id, "secret-$id", userId, username, username, null, actorType, selectedAccountId, accounts)

  @Test
  fun activeSessionComesFirst() {
    val state = SessionsState(listOf(session("s1", "u1", "other"), session("s2", "u2", "alan")), activeSessionId = "s2")

    val sections = AccountSwitcherSections.make(state)

    assertEquals(listOf("s2", "s1"), sections.map { it.sessionId })
    assertEquals(listOf(true, false), sections.map { it.isActive })
  }

  @Test
  fun personalAccountComesFirstInEachSection() {
    val state = SessionsState(
      listOf(session("s1", "u1", "alan", accounts = listOf(account("org", null), account("personal", "u1")))),
      activeSessionId = "s1"
    )

    assertEquals(listOf("personal", "org"), AccountSwitcherSections.make(state)[0].rows.map { it.account.id })
  }

  @Test
  fun onlyTheActiveSessionShowsASelection() {
    val state = SessionsState(
      listOf(
        session("s1", "u1", "alan", selectedAccountId = "org", accounts = listOf(account("org", null))),
        session("s2", "u2", "other", selectedAccountId = "acc-2", accounts = listOf(account("acc-2", "u2")))
      ),
      activeSessionId = "s1"
    )

    val sections = AccountSwitcherSections.make(state)

    assertEquals(listOf("org"), sections[0].rows.filter { it.isSelected }.map { it.account.id })
    assertTrue(sections[1].rows.none { it.isSelected })
  }

  @Test
  fun partnerSessionIsFlagged() {
    val state = SessionsState(listOf(session("s1", "p1", "partner-user", actorType = ActorType.Partner)), activeSessionId = "s1")

    assertTrue(AccountSwitcherSections.make(state)[0].isPartner)
  }
}
