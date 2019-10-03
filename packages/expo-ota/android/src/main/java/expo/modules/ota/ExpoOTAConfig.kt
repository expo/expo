package expo.modules.ota

import okhttp3.OkHttpClient

data class ExpoOTAConfig @JvmOverloads constructor(
        val manifestUrl: String,
        val manifestHeaders: Map<String, String>,
        val channelIdentifier: String,
        val manifestHttpClient: OkHttpClient? = null,
        val manifestComparator: ManifestComparator = VersionNumberManifestComparator(),
        val bundleHttpClient: OkHttpClient? = null
)

@JvmOverloads
fun expoHostedOTAConfig(username: String,
                        projectName: String,
                        releaseChannel: String = "default",
                        manifestHttpClient: OkHttpClient? = null,
                        bundleHttpClient: OkHttpClient? = null,
                        expoSdkVersion: String = "34.0.0",
                        manifestComparator: ManifestComparator = VersionNumberManifestComparator(),
                        apiVersion: Number = 1): ExpoOTAConfig {
    return ExpoOTAConfig(manifestUrl = "https://exp.host/@$username/$projectName",
            manifestHeaders = mapOf(
                    "Accept" to "application/expo+json,application/json",
                    "Exponent-SDK-Version" to expoSdkVersion,
                    "Expo-Api-Version" to apiVersion.toString(),
                    "Expo-Release-Channel" to releaseChannel,
                    "Exponent-Platform" to "android"),
            manifestHttpClient = manifestHttpClient,
            channelIdentifier = releaseChannel,
            manifestComparator = manifestComparator,
            bundleHttpClient = bundleHttpClient)
}