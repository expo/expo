pluginManagement {
  repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
  }
}

include(
  ":expo-autolinking-plugin-shared",
  ":expo-autolinking-settings-plugin",
  ":expo-autolinking-plugin"
)

rootProject.name = "expo-gradle-plugin"
