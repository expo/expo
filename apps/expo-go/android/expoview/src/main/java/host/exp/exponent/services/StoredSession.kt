package host.exp.exponent.services

enum class ActorType { User, Partner }

data class StoredAccount(
  val id: String,
  val name: String,
  val ownerUserId: String?,
  val ownerUsername: String?,
  val ownerFullName: String?,
  val ownerAvatarUrl: String?
)

data class StoredSession(
  val id: String,
  val sessionSecret: String,
  val userId: String? = null,
  val username: String? = null,
  val displayName: String? = null,
  val avatarUrl: String? = null,
  val actorType: ActorType = ActorType.User,
  val selectedAccountId: String? = null,
  val accounts: List<StoredAccount> = emptyList()
)

data class SessionProfile(
  val userId: String,
  val username: String,
  val displayName: String,
  val avatarUrl: String?,
  val actorType: ActorType,
  val accounts: List<StoredAccount>
)

data class SessionsState(
  val sessions: List<StoredSession> = emptyList(),
  val activeSessionId: String? = null
) {
  val activeSession: StoredSession?
    get() = sessions.firstOrNull { it.id == activeSessionId }
}
