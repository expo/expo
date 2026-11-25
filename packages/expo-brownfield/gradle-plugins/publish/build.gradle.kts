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
  implementation("expo.modules:expo-autolinking-plugin-shared")
  implementation("org.json:json:20250517")
  implementation(gradleApi())
  // Matches FUSED_AGP_VERSION in the config plugin — the newest AGP the plugin can
  // run against (forced in fused mode). Compiling against a newer major than the
  // runtime AGP risks NoSuchMethodError on changed APIs.
  compileOnly("com.android.tools.build:gradle:8.13.0")
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

tasks.withType<KotlinCompile> { kotlinOptions { jvmTarget = JavaVersion.VERSION_11.toString() } }

group = "expo.modules"

gradlePlugin {
  plugins {
    create("expoBrownfieldPublishPlugin") {
      id = "expo-brownfield-publish"
      implementationClass = "expo.modules.plugin.ExpoPublishPlugin"
    }
  }
}
