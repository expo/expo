plugins {
  id("com.android.library")
  id("org.jetbrains.kotlin.android")
  id("com.facebook.react")
  id("expo-brownfield-setup")
}

group = "${{groupId}}"

version = "${{version}}"

react { autolinkLibrariesWithApp() }

android {
  namespace = "${{packageId}}"
  compileSdk = 36

  buildFeatures { buildConfig = true }

  defaultConfig {
    minSdk = 24
    consumerProguardFiles("consumer-rules.pro")
    buildConfigField(
        "String",
        "REACT_NATIVE_RELEASE_LEVEL",
        "\"${findProperty("reactNativeReleaseLevel") ?: "stable"}\"",
    )
    // IS_NEW_ARCHITECTURE_ENABLED, IS_HERMES_ENABLED, and IS_EDGE_TO_EDGE_ENABLED are
    // injected by ExpoBrownfieldSetupPlugin.ensureEntryPointBuildConfigFields so the
    // autolinking-generated ReactNativeApplicationEntryPoint.java compiles against this
    // library's BuildConfig.
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
