package expo.modules.ota

import android.content.Context
import okhttp3.OkHttpClient
import org.json.JSONObject

const val defaultCheckAutomatically = true

data class ExpoOTAConfig @JvmOverloads constructor(
        val manifestUrl: String,
        val manifestHeaders: Map<String, String>,
        val channelIdentifier: String,
        val manifestHttpClient: OkHttpClient,
        val manifestComparator: ManifestComparator = defaultManifestComparator,
        val bundleHttpClient: OkHttpClient? = null,
        val checkForUpdatesAutomatically: Boolean = defaultCheckAutomatically,
        val manifestResponseValidator: ManifestResponseValidator
)
val defaultManifestComparator: ManifestComparator = CommitTimeManifestComparator(SdkVersionMustBeEqualNativeComparator())
private fun defaultValidator(manifestClient: OkHttpClient) = ExpoValidator("https://exp.host/--/manifest-public-key", manifestClient)

fun embeddedManifestExpoConfig(context: Context): ExpoOTAConfig {
    val embeddedManifestAndBundle = EmbeddedManifestAndBundle(context).readManifest()
    val releaseChannel = embeddedManifestAndBundle.getString("releaseChannel")
    val sdkVersion = embeddedManifestAndBundle.getString("sdkVersion")
    val hostUri = embeddedManifestAndBundle.getString("hostUri")
    val updatesConfig: JSONObject? = embeddedManifestAndBundle.optJSONObject("updates")
    var checkAutomatically = defaultCheckAutomatically
    var manifestComparator = defaultManifestComparator
    if(updatesConfig != null) {
        checkAutomatically = updatesConfig.optString("checkAutomatically") != "ON_ERROR_RECOVERY"
        val manifestComparatorValue = updatesConfig.optString("versionComparison")
        manifestComparator = manifestComparatorByVersionComparisonValue(manifestComparatorValue)
    }
    val manifestClient = OkHttpClient()
    return ExpoOTAConfig(manifestUrl = "https://$hostUri",
            manifestHeaders = manifestHeaders(expoSdkVersion = sdkVersion, releaseChannel = releaseChannel),
            channelIdentifier = releaseChannel,
            manifestComparator = manifestComparator,
            manifestHttpClient = manifestClient,
            checkForUpdatesAutomatically = checkAutomatically,
            manifestResponseValidator = defaultValidator(manifestClient))
}

@JvmOverloads
@Suppress("unused")
fun expoHostedOTAConfig(username: String,
                        projectName: String,
                        releaseChannel: String = "default",
                        validateManifestResponse: Boolean = true,
                        expoSdkVersion: String = "35.0.0",
                        manifestHttpClient: OkHttpClient? = null,
                        bundleHttpClient: OkHttpClient? = null,
                        manifestComparator: ManifestComparator = defaultManifestComparator,
                        apiVersion: Number = 1): ExpoOTAConfig {
    val manifestClient = manifestHttpClient
            ?: OkHttpClient()
    return ExpoOTAConfig(manifestUrl = "https://exp.host/@$username/$projectName",
            manifestHeaders = manifestHeaders(expoSdkVersion, apiVersion, releaseChannel),
            manifestHttpClient = manifestClient,
            channelIdentifier = releaseChannel,
            manifestComparator = manifestComparator,
            bundleHttpClient = bundleHttpClient,
            manifestResponseValidator = if (validateManifestResponse) ExpoValidator("https://exp.host/--/manifest-public-key", manifestClient) else DummyValidator())
}

private fun manifestHeaders(expoSdkVersion: String, apiVersion: Number = 1, releaseChannel: String): Map<String, String> {
    return mapOf(
            "Accept" to "application/expo+json,application/json",
            "Exponent-SDK-Version" to expoSdkVersion,
            "Expo-Api-Version" to apiVersion.toString(),
            "Expo-Release-Channel" to releaseChannel,
            "Exponent-Accept-Signature" to "true",
            "Exponent-Platform" to "android")
}

private fun manifestComparatorByVersionComparisonValue(versionComparison: String?): ManifestComparator {
    return when (versionComparison) {
        "VERSION" -> VersionNumberManifestComparator(SdkVersionMustBeEqualNativeComparator())
        "REVISION" -> RevisionIdManifestComparator(SdkVersionMustBeEqualNativeComparator())
        "NEWEST" -> CommitTimeManifestComparator(SdkVersionMustBeEqualNativeComparator())
        else -> defaultManifestComparator
    }
}