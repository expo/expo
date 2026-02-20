plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("com.facebook.react")
}

android {
    namespace = "dev.expo.brownfieldtester"
    compileSdk = 36

    defaultConfig {
        applicationId = "dev.expo.brownfieldtester"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
}

val projectRoot = File(rootDir.absoluteFile, "../expo-app").absolutePath

react {
    root = File(projectRoot)
    entryFile = file(listOf("node", "-e", "require('expo/scripts/resolveAppEntry')", projectRoot, "android", "absolute").let { ProcessBuilder(it).directory(rootDir).start().inputStream.bufferedReader().readText().trim() })
    reactNativeDir = file(listOf("node", "--print", "require.resolve('react-native/package.json')").let { ProcessBuilder(it).directory(rootDir).start().inputStream.bufferedReader().readText().trim() }).parentFile.absoluteFile
    hermesCommand = file(listOf("node", "--print", "require.resolve('hermes-compiler/package.json', { paths: [require.resolve('react-native/package.json')] })").let { ProcessBuilder(it).directory(rootDir).start().inputStream.bufferedReader().readText().trim() }).parentFile.absolutePath + "/hermesc/%OS-BIN%/hermesc"
    codegenDir = file(listOf("node", "--print", "require.resolve('@react-native/codegen/package.json', { paths: [require.resolve('react-native/package.json')] })").let { ProcessBuilder(it).directory(rootDir).start().inputStream.bufferedReader().readText().trim() }).parentFile.absoluteFile
    enableBundleCompression = false

    // Use Expo CLI to bundle the app, this ensures the Metro config works correctly with Expo projects.
    cliFile = file(listOf("node", "--print", "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })").let { ProcessBuilder(it).directory(rootDir).start().inputStream.bufferedReader().readText().trim() })
    bundleCommand = "export:embed"

    /* Autolinking */
    autolinkLibrariesWithApp()
}
