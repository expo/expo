import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version("2.0.21")
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

dependencies {
  implementation(gradleApi())
  compileOnly("com.android.tools.build:gradle:8.5.0")
  implementation("com.facebook.react:react-native-gradle-plugin")
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
    register("expoUpdatesPlugin") {
      id = "expo-updates-gradle-plugin"
      implementationClass = "expo.modules.updates.ExpoUpdatesPlugin"
    }
  }
}
