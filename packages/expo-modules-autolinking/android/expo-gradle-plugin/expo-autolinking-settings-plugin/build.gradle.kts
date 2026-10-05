import org.gradle.api.tasks.testing.logging.TestExceptionFormat
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
  compileOnly("com.android.tools.build:gradle:9.2.1")

  testImplementation("junit:junit:4.13.2")
  testImplementation("com.google.truth:truth:1.1.2")
  testImplementation("io.mockk:mockk:1.14.2")
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
    create("expoAutolinkingSettingsPlugin") {
      id = "expo-autolinking-settings"
      implementationClass = "expo.modules.plugin.ExpoAutolinkingSettingsPlugin"
    }
  }
}

tasks.withType<Test>().configureEach {
  // Lets the tests fixture symlink the monorepo's `expo-modules-autolinking` into its `node_modules`,
  // so the settings plugin runs the autolinking JS from this checkout instead of a published `expo`.
  systemProperty("expo.autolinkingDir", rootDir.parentFile.parentFile.absolutePath)

  testLogging {
    exceptionFormat = TestExceptionFormat.FULL
    showExceptions = true
    showCauses = true
    showStackTraces = true
  }
}
