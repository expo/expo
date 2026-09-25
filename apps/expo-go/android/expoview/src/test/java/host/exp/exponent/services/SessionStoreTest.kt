package host.exp.exponent.services

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import host.exp.exponent.TestApplication
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = TestApplication::class)
class SessionStoreTest {
  private val context: Context = RuntimeEnvironment.getApplication()
  private val preferences: SharedPreferences = context.getSharedPreferences("session-store-test", Context.MODE_PRIVATE)
  private val cipher = FakeSessionCipher()
  private val store = SessionStore(preferences, cipher)

  private fun profile(userId: String, username: String, accounts: List<StoredAccount> = emptyList(), actorType: ActorType = ActorType.User) =
    SessionProfile(userId, username, username, null, actorType, accounts)

  private fun account(id: String, ownerUserId: String?) = StoredAccount(id, id, ownerUserId, null, null, null)

  @Test
  fun addMakesTheNewSessionActive() {
    store.add("a")
    val second = store.add("b")

    assertEquals(listOf("a", "b"), store.state.value.sessions.map { it.sessionSecret })
    assertEquals(second.id, store.activeSession?.id)
  }

  @Test
  fun sessionsPersistAcrossInstancesAndAreNotStoredInPlainText() {
    val session = store.add("secret-value")

    val reloaded = SessionStore(preferences, cipher)

    assertEquals(listOf(session), reloaded.state.value.sessions)
    assertEquals(session.id, reloaded.activeSession?.id)
    assertFalse(preferences.all.values.any { it.toString().contains("secret-value") })
  }

  @Test
  fun undecryptableDataGivesAnEmptyStore() {
    store.add("a")
    cipher.failsToDecrypt = true

    val reloaded = SessionStore(preferences, cipher)

    assertTrue(reloaded.state.value.sessions.isEmpty())
    assertTrue(preferences.all.isEmpty())
  }

  @Test
  fun removeActiveFallsBackToTheFirstRemainingSession() {
    val first = store.add("a")
    val second = store.add("b")

    store.remove(second.id)

    assertEquals(first.id, store.activeSession?.id)
  }

  @Test
  fun removeNonActiveKeepsTheActiveSession() {
    val first = store.add("a")
    val second = store.add("b")

    store.remove(first.id)

    assertEquals(second.id, store.activeSession?.id)
  }

  @Test
  fun removingTheLastSessionClearsStorage() {
    val session = store.add("a")

    store.remove(session.id)

    assertNull(store.activeSession)
    assertTrue(preferences.all.isEmpty())
  }

  @Test
  fun updateProfileFillsFieldsAndSelectsTheFirstAccount() {
    val session = store.add("a")

    store.updateProfile(session.id, profile("user-1", "alan", listOf(account("acc-1", "user-1"), account("org", null))))

    val updated = store.activeSession!!
    assertEquals("user-1", updated.userId)
    assertEquals("alan", updated.username)
    assertEquals("acc-1", updated.selectedAccountId)
    assertEquals(2, updated.accounts.size)
  }

  @Test
  fun updateProfileKeepsAValidSelectedAccount() {
    val session = store.add("a")
    store.selectAccount("org", session.id)

    store.updateProfile(session.id, profile("user-1", "alan", listOf(account("acc-1", "user-1"), account("org", null))))

    assertEquals("org", store.activeSession?.selectedAccountId)
  }

  @Test
  fun updateProfileMarksAPartnerActor() {
    val session = store.add("a")

    store.updateProfile(session.id, profile("partner-1", "partner-user", actorType = ActorType.Partner))

    assertEquals(ActorType.Partner, store.activeSession?.actorType)
  }

  @Test
  fun updateProfileReplacesOlderSessionOfSameUser() {
    val older = store.add("old")
    assertFalse(store.updateProfile(older.id, profile("user-1", "alan")))
    val newer = store.add("new")

    val replaced = store.updateProfile(newer.id, profile("user-1", "alan"))

    assertTrue(replaced)
    assertEquals(listOf(newer.id), store.state.value.sessions.map { it.id })
  }

  @Test
  fun selectAccountOnlyChangesThatSession() {
    val first = store.add("a")
    val second = store.add("b")

    store.selectAccount("acc-2", first.id)

    assertEquals("acc-2", store.state.value.sessions.first { it.id == first.id }.selectedAccountId)
    assertNull(store.state.value.sessions.first { it.id == second.id }.selectedAccountId)
  }

  @Test
  fun activateIgnoresUnknownIds() {
    val session = store.add("a")

    store.activate("missing")

    assertEquals(session.id, store.activeSession?.id)
  }

  @Test
  fun migratesTheLegacySessionAndDeletesIt() {
    val legacy = context.getSharedPreferences("expo_session", Context.MODE_PRIVATE)
    legacy.edit(commit = true) {
      putString("session_secret", "legacy-secret")
      putString("selected_account_id", "acc-1")
      putString("theme", "Dark")
    }

    store.migrateLegacySession(legacy)

    assertEquals("legacy-secret", store.activeSession?.sessionSecret)
    assertEquals("acc-1", store.activeSession?.selectedAccountId)
    assertFalse(legacy.contains("session_secret"))
    assertFalse(legacy.contains("selected_account_id"))
    assertEquals("Dark", legacy.getString("theme", null))
  }

  @Test
  fun migrationDoesNotAddWhenSessionsExist() {
    store.add("current")
    val legacy = context.getSharedPreferences("expo_session", Context.MODE_PRIVATE)
    legacy.edit(commit = true) { putString("session_secret", "stale") }

    store.migrateLegacySession(legacy)

    assertEquals(listOf("current"), store.state.value.sessions.map { it.sessionSecret })
    assertFalse(legacy.contains("session_secret"))
  }
}
