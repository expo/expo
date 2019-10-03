package expo.modules.ota

import android.text.TextUtils
import net.swiftzer.semver.SemVer
import org.json.JSONObject
import java.util.*

interface ManifestComparator {
    fun shouldDownloadBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean
}

const val MANIFEST_VERSION_KEY = "version"

class VersionNumberManifestComparator: ManifestComparator {
    override fun shouldDownloadBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean {
        val newVersion = newManifest.optString(MANIFEST_VERSION_KEY, "")
        val lastVersion = lastManifest.optString(MANIFEST_VERSION_KEY, "")
        return when {
            TextUtils.isEmpty(newVersion) -> throw IllegalArgumentException("Manifest must provide version parameter!")
            TextUtils.isEmpty(lastVersion) -> true
            else -> compareVersions(newVersion, lastVersion) > 0
        }
    }

    private fun compareVersions(version1: String, version2: String): Int { // TODO: Do some semver in here!
        return SemVer.parse(version1).compareTo(SemVer.parse(version2))
    }

}

const val MANIFEST_REVISION_KEY = "revisionId"

class RevisionIdManifestCompoarator: ManifestComparator {
    override fun shouldDownloadBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean {
        val newVersion = newManifest.optString(MANIFEST_REVISION_KEY, "")
        val lastVersion = lastManifest.optString(MANIFEST_REVISION_KEY, "")
        return when {
            TextUtils.isEmpty(newVersion) -> throw IllegalArgumentException("Manifest must provide version parameter!")
            TextUtils.isEmpty(lastVersion) -> true
            else -> newVersion != lastVersion
        }
    }

}
