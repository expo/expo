package expo.modules.ota

import okhttp3.OkHttpClient

data class ExpoOTAConfig @JvmOverloads constructor(
        val manifestUrl: String,
        val manifestHeaders: Map<String, String>,
        val channelIdentifier: String,
        val manifestHttpClient: OkHttpClient,
        val manifestComparator: ManifestComparator = VersionNumberManifestComparator(),
        val bundleHttpClient: OkHttpClient? = null,
        val manifestResponseValidator: ManifestResponseValidator
)

@JvmOverloads @Suppress("unused")
fun expoHostedOTAConfig(username: String,
                        projectName: String,
                        releaseChannel: String = "default",
                        validateManifestResponse: Boolean = true,
                        expoSdkVersion: String = "34.0.0",
                        manifestHttpClient: OkHttpClient? = null,
                        bundleHttpClient: OkHttpClient? = null,
                        manifestComparator: ManifestComparator = VersionNumberManifestComparator(),
                        apiVersion: Number = 1): ExpoOTAConfig {
    val manifestClient = manifestHttpClient
            ?: OkHttpClient()
    return ExpoOTAConfig(manifestUrl = "https://exp.host/@$username/$projectName",
            manifestHeaders = mapOf(
                    "Accept" to "application/expo+json,application/json",
                    "Exponent-SDK-Version" to expoSdkVersion,
                    "Expo-Api-Version" to apiVersion.toString(),
                    "Expo-Release-Channel" to releaseChannel,
                    "Exponent-Accept-Signature" to "true",
                    "Exponent-Platform" to "android"),
            manifestHttpClient = manifestClient,
            channelIdentifier = releaseChannel,
            manifestComparator = manifestComparator,
            bundleHttpClient = bundleHttpClient,
            manifestResponseValidator = if (validateManifestResponse) ExpoValidator("https://exp.host/--/manifest-public-key", manifestClient) else DummyValidator())
}