import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.9.24"
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

val gradleProperties = project
  .rootProject
  .gradle
  .parent
  ?.extensions
  ?.extraProperties

val expoAutolinkingSettingsPlugin = if (gradleProperties?.has("expoAutolinkingSettingsPlugin") == true) {
  gradleProperties.get("expoAutolinkingSettingsPlugin") as? Boolean
} else {
  false
}

val isExpoAutolinkingSettingsPluginAvailable = expoAutolinkingSettingsPlugin == true

dependencies {
  implementation(gradleApi())
  compileOnly("com.android.tools.build:gradle:8.5.0")
  implementation("com.facebook.react:react-native-gradle-plugin")
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

  if (isExpoAutolinkingSettingsPluginAvailable) {
    implementation("expo.modules:expo-autolinking-plugin-shared")
  }

  testImplementation("junit:junit:4.13.2")
  testImplementation("com.google.truth:truth:1.1.2")
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11

  sourceSets {
    val path = if (isExpoAutolinkingSettingsPluginAvailable) {
      "withAutolinkingPlugin"
    } else {
      "withoutAutolinkingPlugin"
    }
    getByName("main").java.srcDirs("src/${path}/kotlin")
  }
}

tasks.withType<KotlinCompile> {
  kotlinOptions {
    jvmTarget = JavaVersion.VERSION_11.toString()
  }
}

group = "expo.modules"

gradlePlugin {
  plugins {
    register("expoModulesGradlePlugin") {
      id = "expo-module-gradle-plugin"
      implementationClass = "expo.modules.plugin.ExpoModulesGradlePlugin"
    }
  }
}

tasks.withType<Test>().configureEach {
  testLogging {
    exceptionFormat = TestExceptionFormat.FULL
    showExceptions = true
    showCauses = true
    showStackTraces = true
  }
}
