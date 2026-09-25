import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion

plugins {
  kotlin("jvm") version "2.2.21"
}

// Spotless resolves the rule set by these coordinates. The bare-expo and expo-go builds include this
// build, so Gradle substitutes it for the coordinates passed to `customRuleSets`.
group = "expo.ktlint"
version = "1.0.0"

// Must match the ktlint version in the Spotless config of apps/bare-expo and apps/expo-go.
val ktlintVersion = "1.0.1"

java {
  sourceCompatibility = JavaVersion.VERSION_17
  targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_17)
    // The rules run on ktlint's own Kotlin 1.9 stdlib, so don't call newer stdlib APIs.
    apiVersion.set(KotlinVersion.KOTLIN_1_9)
    languageVersion.set(KotlinVersion.KOTLIN_1_9)
  }
}

dependencies {
  // Everything is provided by ktlint at runtime; the rule set jar must not bring its own copies.
  compileOnly(kotlin("stdlib"))
  compileOnly("com.pinterest.ktlint:ktlint-cli-ruleset-core:$ktlintVersion")
  compileOnly("com.pinterest.ktlint:ktlint-rule-engine-core:$ktlintVersion")

  testImplementation(kotlin("stdlib"))
  testImplementation("com.pinterest.ktlint:ktlint-cli-ruleset-core:$ktlintVersion")
  testImplementation("com.pinterest.ktlint:ktlint-rule-engine-core:$ktlintVersion")
  testImplementation("com.pinterest.ktlint:ktlint-test:$ktlintVersion")
  testImplementation(platform("org.junit:junit-bom:5.10.1"))
  testImplementation("org.junit.jupiter:junit-jupiter")
  testRuntimeOnly("org.junit.platform:junit-platform-launcher")
  // ktlint-test logs through SLF4J but doesn't ship a binding.
  testRuntimeOnly("org.slf4j:slf4j-simple:2.0.9")
}

tasks.test {
  useJUnitPlatform()
}
