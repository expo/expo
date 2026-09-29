package host.exp.exponent.services

import com.apollographql.apollo.api.ApolloResponse
import host.exp.exponent.graphql.Home_CurrentUserActorQuery
import host.exp.exponent.graphql.fragment.CurrentUserActorData

fun CurrentUserActorData.toSessionProfile(): SessionProfile =
  SessionProfile(
    userId = id,
    username = onUserActor?.username ?: onPartnerActor?.username ?: displayName,
    displayName = displayName,
    avatarUrl = onUserActor?.primaryAccountProfileImageUrl,
    actorType = if (onPartnerActor != null) ActorType.Partner else ActorType.User,
    accounts = accounts.map { account ->
      StoredAccount(
        id = account.id,
        name = account.name,
        ownerUserId = account.ownerUserActor?.id,
        ownerUsername = account.ownerUserActor?.username,
        ownerFullName = account.ownerUserActor?.fullName,
        ownerAvatarUrl = account.ownerUserActor?.primaryAccountProfileImageUrl
      )
    }
  )

fun ApolloResponse<Home_CurrentUserActorQuery.Data>.isRevokedSession(): Boolean =
  data != null && data?.meActor == null && exception == null && errors.isNullOrEmpty()
