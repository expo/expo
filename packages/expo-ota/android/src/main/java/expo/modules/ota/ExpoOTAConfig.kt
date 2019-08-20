package expo.modules.ota

import okhttp3.OkHttpClient

interface ManifestRequestConfig {
    val headers: Map<String, String>
    val url: String
}

data class ExpoManifestConfig @JvmOverloads constructor(
        val username: String,
        val projectName: String,
        val releaseChannel: String = "default",
        val expoSdkVersion: String = "34.0.0",
        val apiVersion: Number = 1) : ManifestRequestConfig {

    override val headers: Map<String, String> = mapOf("Accept" to "application/expo+json,application/json",
            "Exponent-SDK-Version" to expoSdkVersion,
            "Expo-Api-Version" to apiVersion.toString(),
            "Expo-Release-Channel" to releaseChannel,
            "Exponent-Platform" to "android")

    override val url: String = "https://exp.host/@$username/$projectName"
}

data class CustomManifestConfig(override val url: String, override val headers: Map<String, String>) : ManifestRequestConfig

data class ExpoOTAConfig @JvmOverloads constructor(
        val manifestConfig: ManifestRequestConfig,
        val id: String = "default",
        val manifestComparator: ManifestComparator = VersionNumberManifestCompoarator(),
        val manifestHttpClient: OkHttpClient? = null,
        val bundleHttpClient: OkHttpClient? = null
)