plugins {
  id("com.android.library")
  id("org.jetbrains.kotlin.android")
  id("com.facebook.react")
  id("expo-brownfield-setup")
}

group = "com.community.minimaltester"

version = "1.0.0"

react { autolinkLibrariesWithApp() }

android {
  namespace = "com.community.minimaltester.brownfield"
  compileSdk = 36

  buildFeatures { buildConfig = true }

  defaultConfig {
    minSdk = 24
    consumerProguardFiles("consumer-rules.pro")
    buildConfigField(
        "boolean",
        "IS_NEW_ARCHITECTURE_ENABLED",
        properties["newArchEnabled"].toString(),
    )
    buildConfigField("boolean", "IS_HERMES_ENABLED", properties["hermesEnabled"].toString())
    buildConfigField(
        "boolean",
        "IS_EDGE_TO_EDGE_ENABLED",
        properties["edgeToEdgeEnabled"].toString(),
    )
    buildConfigField(
        "String",
        "REACT_NATIVE_RELEASE_LEVEL",
        "\"${findProperty("reactNativeReleaseLevel") ?: "stable"}\"",
    )
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }
  kotlinOptions { jvmTarget = "17" }
}

dependencies {
  api("com.facebook.react:react-android")
  api("com.facebook.hermes:hermes-android")
  compileOnly("androidx.fragment:fragment-ktx:1.6.1")
}
