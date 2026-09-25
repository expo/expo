package host.exp.exponent.services

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import android.util.Log
import androidx.annotation.VisibleForTesting
import androidx.core.content.edit
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.UUID

class SessionStore(
  private val preferences: SharedPreferences,
  private val cipher: SessionCipher
) {
  private val gson = Gson()
  private val _state = MutableStateFlow(load())
  val state: StateFlow<SessionsState> = _state

  val activeSession: StoredSession?
    get() = _state.value.activeSession

  fun add(sessionSecret: String): StoredSession {
    val session = StoredSession(id = UUID.randomUUID().toString(), sessionSecret = sessionSecret)
    update { SessionsState(it.sessions + session, session.id) }
    return session
  }

  fun activate(id: String) = update { state ->
    if (state.sessions.any { it.id == id }) state.copy(activeSessionId = id) else state
  }

  fun remove(id: String) = update { state ->
    val remaining = state.sessions.filterNot { it.id == id }
    val activeId = if (state.activeSessionId == id) remaining.firstOrNull()?.id else state.activeSessionId
    SessionsState(remaining, activeId)
  }

  fun updateProfile(id: String, profile: SessionProfile): Boolean {
    var replacedExisting = false
    update { state ->
      val target = state.sessions.firstOrNull { it.id == id } ?: return@update state
      val selectedAccountId = target.selectedAccountId?.takeIf { selected -> profile.accounts.any { it.id == selected } }
        ?: profile.accounts.firstOrNull()?.id
      val updated = target.copy(
        userId = profile.userId,
        username = profile.username,
        displayName = profile.displayName,
        avatarUrl = profile.avatarUrl,
        actorType = profile.actorType,
        selectedAccountId = selectedAccountId,
        accounts = profile.accounts
      )
      val duplicates = state.sessions.filter { it.id != id && it.userId == profile.userId }
      replacedExisting = duplicates.isNotEmpty()
      state.copy(sessions = state.sessions.filterNot { it in duplicates }.map { if (it.id == id) updated else it })
    }
    return replacedExisting
  }

  fun selectAccount(accountId: String, sessionId: String) = update { state ->
    state.copy(sessions = state.sessions.map { if (it.id == sessionId) it.copy(selectedAccountId = accountId) else it })
  }

  fun migrateLegacySession(legacyPreferences: SharedPreferences) {
    val secret = legacyPreferences.getString(LEGACY_SECRET_KEY, null)
    if (!secret.isNullOrEmpty() && _state.value.sessions.isEmpty()) {
      val session = add(secret)
      legacyPreferences.getString(LEGACY_SELECTED_ACCOUNT_KEY, null)?.let { selectAccount(it, session.id) }
    }
    legacyPreferences.edit(commit = true) {
      remove(LEGACY_SECRET_KEY)
      remove(LEGACY_SELECTED_ACCOUNT_KEY)
    }
  }

  private fun update(transform: (SessionsState) -> SessionsState) {
    synchronized(this) {
      val next = transform(_state.value)
      _state.value = next
      persist(next)
    }
  }

  private fun persist(state: SessionsState) {
    if (state.sessions.isEmpty()) {
      preferences.edit(commit = true) { remove(STATE_KEY) }
      return
    }
    try {
      val encrypted = cipher.encrypt(gson.toJson(state).toByteArray(Charsets.UTF_8))
      preferences.edit(commit = true) { putString(STATE_KEY, Base64.encodeToString(encrypted, Base64.NO_WRAP)) }
    } catch (e: Exception) {
      Log.w(TAG, "Could not save sessions, keeping them in memory only", e)
    }
  }

  private fun load(): SessionsState {
    val stored = preferences.getString(STATE_KEY, null) ?: return SessionsState()
    return try {
      val json = String(cipher.decrypt(Base64.decode(stored, Base64.NO_WRAP)), Charsets.UTF_8)
      gson.fromJson(json, SessionsState::class.java) ?: SessionsState()
    } catch (e: Exception) {
      Log.w(TAG, "Discarding stored sessions that could not be decrypted", e)
      preferences.edit(commit = true) { remove(STATE_KEY) }
      SessionsState()
    }
  }

  companion object {
    private const val TAG = "SessionStore"
    private const val PREFERENCES_NAME = "expo_sessions"
    private const val STATE_KEY = "state"
    private const val LEGACY_PREFERENCES_NAME = "expo_session"
    private const val LEGACY_SECRET_KEY = "session_secret"
    private const val LEGACY_SELECTED_ACCOUNT_KEY = "selected_account_id"

    @Volatile
    private var instance: SessionStore? = null

    fun getInstance(context: Context): SessionStore =
      instance ?: synchronized(this) {
        instance ?: create(context.applicationContext).also { instance = it }
      }

    @VisibleForTesting
    fun setInstanceForTesting(store: SessionStore?) {
      instance = store
    }

    private fun create(context: Context): SessionStore =
      SessionStore(context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE), KeystoreSessionCipher()).apply {
        migrateLegacySession(context.getSharedPreferences(LEGACY_PREFERENCES_NAME, Context.MODE_PRIVATE))
      }
  }
}
