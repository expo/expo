package expo.modules.plugin.gradle

import expo.modules.plugin.configuration.AWSMavenCredentials
import expo.modules.plugin.configuration.BasicMavenCredentials
import expo.modules.plugin.configuration.HttpHeaderMavenCredentials
import expo.modules.plugin.configuration.MavenCredentials
import org.gradle.api.artifacts.repositories.MavenArtifactRepository
import org.gradle.api.credentials.AwsCredentials
import org.gradle.api.credentials.HttpHeaderCredentials
import org.gradle.internal.authentication.DefaultBasicAuthentication
import org.gradle.internal.authentication.DefaultDigestAuthentication
import org.gradle.internal.authentication.DefaultHttpHeaderAuthentication

internal fun MavenArtifactRepository.applyAuthentication(authenticationType: String?) {
  if (authenticationType == null) {
    return
  }

  authentication.add(
    when (authenticationType) {
      "basic" -> DefaultBasicAuthentication("basic")
      "digest" -> DefaultDigestAuthentication("digest")
      "header" -> DefaultHttpHeaderAuthentication("header")
      else -> throw IllegalArgumentException("Unknown authentication type: $authenticationType")
    }
  )
}

internal fun MavenArtifactRepository.applyCredentials(mavenCredentials: MavenCredentials?) {
  if (mavenCredentials == null) {
    return
  }

  when (mavenCredentials) {
    is BasicMavenCredentials -> {
      val (username, password) = mavenCredentials
      credentials { credentials ->
        credentials.username = username
        credentials.password = password
      }
    }

    is HttpHeaderMavenCredentials -> {
      val (name, value) = mavenCredentials
      credentials(HttpHeaderCredentials::class.java) { credentials ->
        credentials.name = name
        credentials.value = value
      }
    }

    is AWSMavenCredentials -> {
      val (accessKey, secretKey, sessionToken) = mavenCredentials
      credentials(AwsCredentials::class.java) { credentials ->
        credentials.accessKey = accessKey
        credentials.secretKey = secretKey
        credentials.sessionToken = sessionToken
      }
    }
  }
}
