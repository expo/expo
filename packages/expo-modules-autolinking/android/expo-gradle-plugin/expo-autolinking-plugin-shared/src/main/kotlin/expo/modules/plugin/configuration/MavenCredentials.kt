package expo.modules.plugin.configuration

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonContentPolymorphicSerializer
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject

/**
 * Based type of maven credentials object.
 */
sealed interface MavenCredentials

@Serializable
data class BasicMavenCredentials(
  val username: String,
  val password: String
) : MavenCredentials

@Serializable
data class HttpHeaderMavenCredentials(
  val name: String,
  val value: String
) : MavenCredentials

@Serializable
data class AWSMavenCredentials(
  val accessKey: String,
  val secretKey: String,
  val sessionToken: String? = null
) : MavenCredentials

/**
 * Custom deserializer for [MavenCredentials].
 * We need to use polymorphic deserialization because we have multiple types of credentials.
 * It'll decide based on present fields which type of credentials it is.
 */
object MavenCredentialsSerializer : JsonContentPolymorphicSerializer<MavenCredentials>(MavenCredentials::class) {
  override fun selectDeserializer(element: JsonElement) = when {
    "username" in element.jsonObject && "password" in element.jsonObject -> BasicMavenCredentials.serializer()
    "name" in element.jsonObject && "value" in element.jsonObject -> HttpHeaderMavenCredentials.serializer()
    "accessKey" in element.jsonObject && "secretKey" in element.jsonObject -> AWSMavenCredentials.serializer()
    else -> throw IllegalStateException("Unknown MavenCredentials type for $element")
  }
}
