package expo.modules.plugin

import com.google.common.truth.Truth
import expo.modules.plugin.configuration.AWSMavenCredentials
import expo.modules.plugin.configuration.BasicMavenCredentials
import expo.modules.plugin.configuration.HttpHeaderMavenCredentials
import expo.modules.plugin.gradle.applyCredentials
import expo.modules.plugin.utils.Env
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkObject
import org.gradle.api.credentials.AwsCredentials
import org.gradle.api.credentials.HttpHeaderCredentials
import org.gradle.testfixtures.ProjectBuilder
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.net.URI

class MavenArtifactRepositoryExtensionTest {
  @Before
  fun setUp() {
    mockkObject(Env)
  }

  @After
  fun tearDown() {
    unmockkObject(Env)
  }

  @Test
  fun `should apply credentials from string values`() {
    val project = ProjectBuilder.builder().build()
    val mavenRepo = project.repositories.maven {
      it.url = URI("auth.maven.test")
      it.applyCredentials(BasicMavenCredentials("username", "password"))
    }
    Truth.assertThat(mavenRepo.credentials.username).isEqualTo("username")
    Truth.assertThat(mavenRepo.credentials.password).isEqualTo("password")
  }

  @Test
  fun `should apply credentials from environment variables`() {
    val project = ProjectBuilder.builder().build()

    every { Env.getProcessEnv("envUsername") } returns "basic1"
    every { Env.getProcessEnv("envPassword") } returns "basic2"
    val mavenRepoBasic = project.repositories.maven {
      it.url = URI("auth.maven.test")
      it.applyCredentials(BasicMavenCredentials("System.getenv('envUsername')", "System.getenv(\"envPassword\")"))
    }
    Truth.assertThat(mavenRepoBasic.credentials.username).isEqualTo("basic1")
    Truth.assertThat(mavenRepoBasic.credentials.password).isEqualTo("basic2")

    every { Env.getProcessEnv("envName") } returns "httpHeader1"
    every { Env.getProcessEnv("envValue") } returns "httpHeader2"
    val mavenRepoHttpHeader = project.repositories.maven {
      it.url = URI("auth.maven.test")
      it.applyCredentials(HttpHeaderMavenCredentials("System.getenv('envName')", "System.getenv(\"envValue\")"))
    }
    val httpHeaderCredentials = mavenRepoHttpHeader.getCredentials(HttpHeaderCredentials::class.java)
    Truth.assertThat(httpHeaderCredentials.name).isEqualTo("httpHeader1")
    Truth.assertThat(httpHeaderCredentials.value).isEqualTo("httpHeader2")

    every { Env.getProcessEnv("envAccessKey") } returns "aws1"
    every { Env.getProcessEnv("envSecretKey") } returns "aws2"
    every { Env.getProcessEnv("envSessionToken") } returns "aws3"
    val mavenRepoAws = project.repositories.maven {
      it.url = URI("auth.maven.test")
      it.applyCredentials(AWSMavenCredentials(
        "System.getenv('envAccessKey')",
        "System.getenv(\"envSecretKey\")",
        "System.getenv('envSessionToken')"))
    }
    val awsCredentials = mavenRepoAws.getCredentials(AwsCredentials::class.java)
    Truth.assertThat(awsCredentials.accessKey).isEqualTo("aws1")
    Truth.assertThat(awsCredentials.secretKey).isEqualTo("aws2")
    Truth.assertThat(awsCredentials.sessionToken).isEqualTo("aws3")
  }

  @Test
  fun `should fallback to original inputs if environment variables not found`() {
    val project = ProjectBuilder.builder().build()

    val mavenRepoBasic = project.repositories.maven {
      it.url = URI("auth.maven.test")
      it.applyCredentials(BasicMavenCredentials("System.getenv('envUsername')", "System.getenv(\"envPassword\")"))
    }
    Truth.assertThat(mavenRepoBasic.credentials.username).isEqualTo("System.getenv('envUsername')")
    Truth.assertThat(mavenRepoBasic.credentials.password).isEqualTo("System.getenv(\"envPassword\")")

    val mavenRepoHttpHeader = project.repositories.maven {
      it.url = URI("auth.maven.test")
      it.applyCredentials(HttpHeaderMavenCredentials("System.getenv('envName')", "System.getenv(\"envValue\")"))
    }
    val httpHeaderCredentials = mavenRepoHttpHeader.getCredentials(HttpHeaderCredentials::class.java)
    Truth.assertThat(httpHeaderCredentials.name).isEqualTo("System.getenv('envName')")
    Truth.assertThat(httpHeaderCredentials.value).isEqualTo("System.getenv(\"envValue\")")

    val mavenRepoAws = project.repositories.maven {
      it.url = URI("auth.maven.test")
      it.applyCredentials(AWSMavenCredentials(
        "System.getenv('envAccessKey')",
        "System.getenv(\"envSecretKey\")",
        "System.getenv('envSessionToken')"))
    }
    val awsCredentials = mavenRepoAws.getCredentials(AwsCredentials::class.java)
    Truth.assertThat(awsCredentials.accessKey).isEqualTo("System.getenv('envAccessKey')")
    Truth.assertThat(awsCredentials.secretKey).isEqualTo("System.getenv(\"envSecretKey\")")
    Truth.assertThat(awsCredentials.sessionToken).isEqualTo("System.getenv('envSessionToken')")
  }
}
