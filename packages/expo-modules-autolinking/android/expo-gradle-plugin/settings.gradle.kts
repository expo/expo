pluginManagement {
  repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
  }
}

plugins {
  kotlin("jvm") version "1.9.24" apply false
}

include(
  ":shared",
  ":expo-autolinking-settings-plugin",
  ":expo-autolinking-plugin"
)

rootProject.name = "expo-gradle-plugin"
