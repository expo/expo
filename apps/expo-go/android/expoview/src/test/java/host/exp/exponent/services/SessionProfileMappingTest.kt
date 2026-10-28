package host.exp.exponent.services

import com.apollographql.apollo.api.json.jsonReader
import com.apollographql.apollo.api.parseResponse
import host.exp.exponent.graphql.Home_CurrentUserActorQuery
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionProfileMappingTest {
  private fun response(json: String) =
    Home_CurrentUserActorQuery().parseResponse(Buffer().writeUtf8(json).jsonReader())

  @Test
  fun aNullActorWithoutErrorsIsARevokedSession() {
    assertTrue(response("""{"data":{"meActor":null}}""").isRevokedSession())
  }

  @Test
  fun aNullActorWithErrorsIsNotARevokedSession() {
    val json = """{"data":{"meActor":null},"errors":[{"message":"Internal server error"}]}"""

    assertFalse(response(json).isRevokedSession())
  }

  private fun parse(json: String) =
    Home_CurrentUserActorQuery().parseResponse(Buffer().writeUtf8(json).jsonReader()).data?.meActor?.currentUserActorData

  @Test
  fun mapsAUserActor() {
    val actor = parse(
      """
      {"data":{"meActor":{"__typename":"User","id":"user-1","displayName":"Alan Hughes",
        "accounts":[{"id":"acc-1","name":"alan","ownerUserActor":{"id":"user-1","username":"alan",
          "primaryAccountProfileImageUrl":"https://example.test/a.png","firstName":"Alan","fullName":"Alan Hughes","lastName":"Hughes"}}],
        "username":"alan","firstName":"Alan","lastName":"Hughes",
        "primaryAccountProfileImageUrl":"https://example.test/a.png","bestContactEmail":"a@example.test"}}}
      """
    )!!

    val profile = actor.toSessionProfile()

    assertEquals("user-1", profile.userId)
    assertEquals("alan", profile.username)
    assertEquals("Alan Hughes", profile.displayName)
    assertEquals(ActorType.User, profile.actorType)
    assertEquals("https://example.test/a.png", profile.avatarUrl)
    assertEquals(StoredAccount("acc-1", "alan", "user-1", "alan", "Alan Hughes", "https://example.test/a.png"), profile.accounts.single())
  }

  @Test
  fun mapsAPartnerActor() {
    val actor = parse(
      """
      {"data":{"meActor":{"__typename":"PartnerActor","id":"partner-1","displayName":"partner-user",
        "accounts":[{"id":"acc-p","name":"partner-user","ownerUserActor":null}],
        "username":"partner-user"}}}
      """
    )!!

    val profile = actor.toSessionProfile()

    assertEquals(ActorType.Partner, profile.actorType)
    assertEquals("partner-user", profile.username)
    assertNull(profile.avatarUrl)
    assertNull(profile.accounts.single().ownerUserId)
  }
}
