package expo.modules.plugin.android

import com.android.build.gradle.LibraryExtension

internal fun LibraryExtension.applySDKVersions(compileSdk: Int, minSdk: Int, targetSdk: Int) {
  this.compileSdk = compileSdk
  defaultConfig {
    this@defaultConfig.minSdk = minSdk
    this@defaultConfig.targetSdk = targetSdk
  }
}

internal fun LibraryExtension.applyLinterOptions() {
  lintOptions.isAbortOnError = false
}

internal fun LibraryExtension.applyPublishingVariant() {
  publishing { publishing ->
    publishing.singleVariant("release") {
      withSourcesJar()
    }
  }
}
