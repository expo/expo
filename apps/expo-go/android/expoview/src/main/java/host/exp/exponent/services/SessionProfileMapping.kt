package host.exp.exponent.services

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
