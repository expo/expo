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

val projectRoot = File(rootDir.absoluteFile, "../../expo-app").absolutePath

/**
 * Executes a Node command via ProcessBuilder, then validates and returns the canonical [File]
 * for the resolved path.
 *
 * Validation steps (throws [IllegalStateException] on failure):
 *  1. Output must be non-empty.
 *  2. Output must be a single line (no embedded newlines – guards against injection).
 *  3. Resolved canonical path must be absolute.
 *  4. Resolved canonical path must start with one of [allowedRoots] (path-traversal guard).
 */
fun resolveNodePath(command: List<String>, workingDir: File, allowedRoots: List<File>): File {
    val raw = ProcessBuilder(command)
        .directory(workingDir)
        .start()
        .inputStream
        .bufferedReader()
        .readText()
        .trim()

    check(raw.isNotEmpty()) {
        "Node command returned empty output.\nCommand: $command"
    }
    check(!raw.contains('\n') && !raw.contains('\r')) {
        "Node command returned multi-line output — possible injection.\nCommand: $command\nOutput: $raw"
    }

    val canonical = File(raw).canonicalFile

    check(canonical.isAbsolute) {
        "Resolved path is not absolute: $canonical\nCommand: $command"
    }

    val canonicalRoots = allowedRoots.map { it.canonicalFile }
    check(canonicalRoots.any { canonical.path.startsWith(it.path + File.separator) || canonical.path == it.path }) {
        "Resolved path '$canonical' is outside allowed roots: $canonicalRoots\nCommand: $command"
    }

    return canonical
}

val allowedRoots = listOf(
    rootDir.canonicalFile,
    File(projectRoot).canonicalFile
)

react {
    root = File(projectRoot)
    entryFile = resolveNodePath(
        listOf("node", "-e", "require('expo/scripts/resolveAppEntry')", projectRoot, "android", "absolute"),
        rootDir, allowedRoots
    )
    reactNativeDir = resolveNodePath(
        listOf("node", "--print", "require.resolve('react-native/package.json')"),
        rootDir, allowedRoots
    ).parentFile
    hermesCommand = resolveNodePath(
        listOf("node", "--print", "require.resolve('hermes-compiler/package.json', { paths: [require.resolve('react-native/package.json')] })"),
        rootDir, allowedRoots
    ).parentFile.absolutePath + "/hermesc/%OS-BIN%/hermesc"
    codegenDir = resolveNodePath(
        listOf("node", "--print", "require.resolve('@react-native/codegen/package.json', { paths: [require.resolve('react-native/package.json')] })"),
        rootDir, allowedRoots
    ).parentFile
    enableBundleCompression = false

    // Use Expo CLI to bundle the app, this ensures the Metro config works correctly with Expo projects.
    cliFile = resolveNodePath(
        listOf("node", "--print", "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })"),
        rootDir, allowedRoots
    )
    bundleCommand = "export:embed"

    /* Autolinking */
    autolinkLibrariesWithApp()
}
