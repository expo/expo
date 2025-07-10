package expo.modules.plugin.gradle

import expo.modules.plugin.configuration.AWSMavenCredentials
import expo.modules.plugin.configuration.BasicMavenCredentials
import expo.modules.plugin.configuration.HttpHeaderMavenCredentials
import expo.modules.plugin.configuration.MavenCredentials
import expo.modules.plugin.utils.Env
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
        credentials.username = resolveEnvVar(username)
        credentials.password = resolveEnvVar(password)
      }
    }

    is HttpHeaderMavenCredentials -> {
      val (name, value) = mavenCredentials
      credentials(HttpHeaderCredentials::class.java) { credentials ->
        credentials.name = resolveEnvVar(name)
        credentials.value = resolveEnvVar(value)
      }
    }

    is AWSMavenCredentials -> {
      val (accessKey, secretKey, sessionToken) = mavenCredentials
      credentials(AwsCredentials::class.java) { credentials ->
        credentials.accessKey = resolveEnvVar(accessKey)
        credentials.secretKey = resolveEnvVar(secretKey)
        credentials.sessionToken = sessionToken?.let { resolveEnvVar(it) }
      }
    }
  }
}

private val ENV_REGEX = """System\.getenv\(['"]([A-Za-z0-9_]+)['"]\)""".toRegex()

/**
 * Utility function to substitute environment variables in strings.
 * Supports patterns like System.getEnv('VAR_NAME') or System.getEnv("VAR_NAME")
 */
private fun resolveEnvVar(input: String): String {
  return ENV_REGEX.replace(input) { match ->
    val name = match.groupValues[1]
    // Return original if env var not found
    Env.getProcessEnv(name) ?: match.value
  }
}
