package host.exp.exponent.services

import com.google.gson.annotations.SerializedName

enum class ActorType {
  @SerializedName("User")
  User,

  @SerializedName("Partner")
  Partner
}

data class StoredAccount(
  @SerializedName("id") val id: String,
  @SerializedName("name") val name: String,
  @SerializedName("ownerUserId") val ownerUserId: String?,
  @SerializedName("ownerUsername") val ownerUsername: String?,
  @SerializedName("ownerFullName") val ownerFullName: String?,
  @SerializedName("ownerAvatarUrl") val ownerAvatarUrl: String?
)

data class StoredSession(
  @SerializedName("id") val id: String,
  @SerializedName("sessionSecret") val sessionSecret: String,
  @SerializedName("userId") val userId: String? = null,
  @SerializedName("username") val username: String? = null,
  @SerializedName("displayName") val displayName: String? = null,
  @SerializedName("avatarUrl") val avatarUrl: String? = null,
  @SerializedName("actorType") val actorType: ActorType = ActorType.User,
  @SerializedName("selectedAccountId") val selectedAccountId: String? = null,
  @SerializedName("accounts") val accounts: List<StoredAccount> = emptyList()
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
  @SerializedName("sessions") val sessions: List<StoredSession> = emptyList(),
  @SerializedName("activeSessionId") val activeSessionId: String? = null
) {
  val activeSession: StoredSession?
    get() = sessions.firstOrNull { it.id == activeSessionId }
}
