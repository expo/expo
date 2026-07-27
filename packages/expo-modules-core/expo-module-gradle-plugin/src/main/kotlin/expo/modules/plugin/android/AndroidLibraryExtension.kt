package expo.modules.plugin.android

import com.android.build.api.dsl.LibraryExtension

internal fun LibraryExtension.applySDKVersions(compileSdk: Int, minSdk: Int) {
  this.compileSdk = compileSdk
  defaultConfig {
    this@defaultConfig.minSdk = minSdk
  }
}

internal fun LibraryExtension.applyLinterOptions() {
  lint.abortOnError = false
}

internal fun LibraryExtension.applyPublishingVariant() {
  publishing {
    singleVariant("release") {
      withSourcesJar()
    }
  }
}
