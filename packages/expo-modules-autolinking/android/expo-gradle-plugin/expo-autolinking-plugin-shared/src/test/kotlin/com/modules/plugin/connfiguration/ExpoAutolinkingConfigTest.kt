package com.modules.plugin.connfiguration

import com.google.common.truth.Truth
import expo.modules.plugin.configuration.AWSMavenCredentials
import expo.modules.plugin.configuration.BasicMavenCredentials
import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import expo.modules.plugin.configuration.HttpHeaderMavenCredentials
import org.junit.Test


class ExpoAutolinkingConfigTest {

  @Test
  fun `can deserialize config`() {
    // language=JSON
    val mockedConfig = """
{
  "extraDependencies": [],
  "modules": [
    {
      "packageName": "expo",
      "packageVersion": "52.0.11",
      "projects": [
        {
          "name": "expo",
          "sourceDir": "/Users/lukasz/work/expo/packages/expo/android"
        }
      ],
      "modules": [
        "expo.modules.fetch.ExpoFetchModule"
      ]
    },
    {
      "packageName": "expo-network-addons",
      "packageVersion": "0.7.0",
      "projects": [
        {
          "name": "expo-network-addons",
          "sourceDir": "/Users/lukasz/work/expo/packages/expo-network-addons/android"
        }
      ],
      "plugins": [
        {
          "id": "expo-network-addons-gradle-plugin",
          "group": "expo.modules",
          "sourceDir": "/Users/lukasz/work/expo/packages/expo-network-addons/expo-network-addons-gradle-plugin",
          "applyToRootProject": true
        }
      ],
      "modules": []
    }
  ]
}
    """.trimIndent()

    val config = ExpoAutolinkingConfig.decodeFromString(mockedConfig)

    Truth.assertThat(config.allProjects.map { it.name })
      .containsExactly("expo", "expo-network-addons")
    val expoModule = config.modules.find { it.packageName == "expo" }
    val expoNetworkAddonsModule = config.modules.find { it.packageName == "expo-network-addons" }

    Truth.assertThat(expoModule).isNotNull()
    Truth.assertThat(expoNetworkAddonsModule).isNotNull()

    expoModule!!
    expoNetworkAddonsModule!!

    Truth.assertThat(expoModule.projects.firstOrNull()?.sourceDir)
      .isEqualTo("/Users/lukasz/work/expo/packages/expo/android")
    Truth.assertThat(expoModule.modules.firstOrNull())
      .isEqualTo("expo.modules.fetch.ExpoFetchModule")

    Truth.assertThat(expoNetworkAddonsModule.projects.firstOrNull()?.sourceDir)
      .isEqualTo("/Users/lukasz/work/expo/packages/expo-network-addons/android")
    Truth.assertThat(expoNetworkAddonsModule.plugins.firstOrNull()?.id)
      .isEqualTo("expo-network-addons-gradle-plugin")
  }

  @Test
  fun `can deserialize extra dependencies`() {
    // language=JSON
    val mockedConfig = """
{
  "modules": [],
  "extraDependencies": [
    {
      "url": "repo1",
      "credentials": {
        "username": "user",
        "password": "password"
      },
      "authentication": "basic"
    },
    {
      "url": "repo2",
      "credentials": {
        "name": "name",
        "value": "value"
      },
      "authentication": "header"
    },
    {
      "url": "repo3",
      "credentials": {
        "accessKey": "accessKey",
        "secretKey": "secretKey"
      },
      "authentication": "digest"
    }
  ]
}
""".trimIndent()

    val config = ExpoAutolinkingConfig.decodeFromString(mockedConfig)

    val repo1 = config.extraDependencies.find { it.url == "repo1" }
    val repo2 = config.extraDependencies.find { it.url == "repo2" }
    val repo3 = config.extraDependencies.find { it.url == "repo3" }

    Truth.assertThat(repo1).isNotNull()
    Truth.assertThat(repo2).isNotNull()
    Truth.assertThat(repo3).isNotNull()

    repo1!!
    repo2!!
    repo3!!

    Truth.assertThat(repo1.authentication).isEqualTo("basic")
    Truth.assertThat(repo1.credentials).isInstanceOf(BasicMavenCredentials::class.java)
    val basicCredentials = repo1.credentials as BasicMavenCredentials
    Truth.assertThat(basicCredentials.username).isEqualTo("user")
    Truth.assertThat(basicCredentials.password).isEqualTo("password")

    Truth.assertThat(repo2.authentication).isEqualTo("header")
    Truth.assertThat(repo2.credentials).isInstanceOf(HttpHeaderMavenCredentials::class.java)
    val headerCredentials = repo2.credentials as HttpHeaderMavenCredentials
    Truth.assertThat(headerCredentials.name).isEqualTo("name")
    Truth.assertThat(headerCredentials.value).isEqualTo("value")

    Truth.assertThat(repo3.authentication).isEqualTo("digest")
    Truth.assertThat(repo3.credentials).isInstanceOf(AWSMavenCredentials::class.java)
    val awsCredentials = repo3.credentials as AWSMavenCredentials
    Truth.assertThat(awsCredentials.accessKey).isEqualTo("accessKey")
    Truth.assertThat(awsCredentials.secretKey).isEqualTo("secretKey")
  }
}
