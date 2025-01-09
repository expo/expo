pluginManagement {
  repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
  }
}

include(
  ":shared",
  ":expo-autolinking-settings-plugin",
  ":expo-autolinking-plugin"
)

rootProject.name = "expo-gradle-plugin"
