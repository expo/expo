import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm")
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

dependencies {
  implementation(project(":expo-autolinking-plugin-shared"))
  implementation(gradleApi())
  compileOnly("com.android.tools.build:gradle:8.5.0")

  testImplementation("junit:junit:4.13.2")
  testImplementation("com.google.truth:truth:1.1.2")
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

tasks.withType<KotlinCompile> {
  kotlinOptions {
    jvmTarget = JavaVersion.VERSION_11.toString()
  }
}

group = "expo.modules"

gradlePlugin {
  plugins {
    create("expoAutolinkingSettingsPlugin") {
      id = "expo-autolinking-settings"
      implementationClass = "expo.modules.plugin.ExpoAutolinkingSettingsPlugin"
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
