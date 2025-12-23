import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "2.1.20"
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

dependencies {
  implementation(gradleApi())
  compileOnly("com.android.tools.build:gradle:8.5.0")
  implementation("com.google.devtools.ksp:symbol-processing-gradle-plugin:2.1.20-2.0.1")
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
    register("expoModuleOptimizedGradlePlugin") {
      id = "expo-module-optimized-gradle-plugin"
      implementationClass = "expo.modules.plugin.optimized.ExpoModuleOptimizedGradlePlugin"
    }
  }
}
