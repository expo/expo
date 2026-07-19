import org.jetbrains.kotlin.gradle.dsl.JvmTarget
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
  testImplementation(gradleTestKit())
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

tasks.withType<KotlinCompile> {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_11)
  }
}

group = "expo.modules"

gradlePlugin {
  plugins {
    create("expoMaxSdkOverridePlugin") {
      id = "expo-max-sdk-override-plugin"
      implementationClass = "expo.modules.plugin.ExpoMaxSdkOverridePlugin"
    }
  }
}
