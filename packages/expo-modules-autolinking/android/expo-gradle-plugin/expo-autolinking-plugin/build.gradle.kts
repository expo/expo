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
    create("expoAutolinkingPlugin") {
      id = "expo-autolinking"
      implementationClass = "expo.modules.plugin.ExpoAutolinkingPlugin"
    }
    create("expoRootProjectPlugin") {
      id = "expo-root-project"
      implementationClass = "expo.modules.plugin.ExpoRootProjectPlugin"
    }
  }
}
