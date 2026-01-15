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
  ":expo-autolinking-plugin",
  ":expo-max-sdk-override-plugin"
)

rootProject.name = "expo-gradle-plugin"
