package expo.modules.ota

import okhttp3.OkHttpClient

interface ManifestDownloadParams {
    val headers: Map<String, String>
    val url: String
    val okHttpClient: OkHttpClient?
}

data class ExpoManifestConfig @JvmOverloads constructor(
        val username: String,
        val projectName: String,
        val releaseChannel: String = "default",
        val expoSdkVersion: String = "34.0.0",
        val apiVersion: Number = 1,
        override val okHttpClient: OkHttpClient? = null) :
        ManifestDownloadParams {

    override val url = "https://exp.host/@$username/$projectName"
    override val headers = mapOf(
            "Accept" to "application/expo+json,application/json",
            "Exponent-SDK-Version" to expoSdkVersion,
            "Expo-Api-Version" to apiVersion.toString(),
            "Expo-Release-Channel" to releaseChannel,
            "Exponent-Platform" to "android")
}

data class CustomManifestConfig(
        override val url: String,
        override val headers: Map<String, String>,
        override val okHttpClient: OkHttpClient?
) : ManifestDownloadParams

data class ExpoOTAConfig @JvmOverloads constructor(
        val manifestConfig: ManifestDownloadParams,
        val id: String = "default",
        val manifestComparator: ManifestComparator = VersionNumberManifestCompoarator(),
        val bundleHttpClient: OkHttpClient? = null
)