package expo.modules.ota

import android.text.TextUtils
import net.swiftzer.semver.SemVer
import org.json.JSONObject
import org.threeten.bp.ZonedDateTime
import org.threeten.bp.format.DateTimeFormatter

interface ManifestComparator {
    fun shouldReplaceBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean
}

const val MANIFEST_VERSION_KEY = "version"
const val MANIFEST_SDK_VERSION_KEY = "sdkVersion"

class VersionNumberManifestComparator(private val nativeComparator: ManifestComparator): ManifestComparator {
    override fun shouldReplaceBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean {
        val newVersion = newManifest.optString(MANIFEST_VERSION_KEY, "")
        val lastVersion = lastManifest.optString(MANIFEST_VERSION_KEY, "")
        return when {
            TextUtils.isEmpty(newVersion) -> false
            TextUtils.isEmpty(lastVersion) -> true
            else -> nativeComparator.shouldReplaceBundle(lastManifest, newManifest) && compareVersions(newVersion, lastVersion) > 0
        }
    }

    private fun compareVersions(version1: String, version2: String): Int { // TODO: Do some semver in here!
        return SemVer.parse(version1).compareTo(SemVer.parse(version2))
    }

}

const val MANIFEST_COMMIT_TIME_KEY = "commitTime"

class CommitTimeManifestComparator(private val nativeComparator: ManifestComparator): ManifestComparator {
    override fun shouldReplaceBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean {
        val newVersionString = newManifest.optString(MANIFEST_COMMIT_TIME_KEY, "")
        val lastVersionString = lastManifest.optString(MANIFEST_COMMIT_TIME_KEY, "")
        return when {
            TextUtils.isEmpty(newVersionString) -> false
            TextUtils.isEmpty(lastVersionString) -> true
            else -> {
                val newVersion = ZonedDateTime.parse(newVersionString)
                val lastVersion = ZonedDateTime.parse(lastVersionString)
                nativeComparator.shouldReplaceBundle(lastManifest, newManifest) && compareCommitTimes(newVersion, lastVersion) > 0
            }
        }
    }

    private fun compareCommitTimes(time1: ZonedDateTime, time2: ZonedDateTime): Int {
        return time1.compareTo(time2)
    }

}

const val MANIFEST_REVISION_KEY = "revisionId"

class RevisionIdManifestComparator(private val nativeComparator: ManifestComparator): ManifestComparator {
    override fun shouldReplaceBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean {
        val newVersion = newManifest.optString(MANIFEST_REVISION_KEY, "")
        val lastVersion = lastManifest.optString(MANIFEST_REVISION_KEY, "")
        return when {
            TextUtils.isEmpty(newVersion) -> throw IllegalArgumentException("Manifest must provide version parameter!")
            TextUtils.isEmpty(lastVersion) -> true
            else -> nativeComparator.shouldReplaceBundle(lastManifest, newManifest) && newVersion != lastVersion
        }
    }

}

class SdkVersionMustBeEqualNativeComparator: ManifestComparator {
    override fun shouldReplaceBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean {
        val newVersion = newManifest.optString(MANIFEST_SDK_VERSION_KEY, "")
        val lastVersion = lastManifest.optString(MANIFEST_SDK_VERSION_KEY, "")
        return when {
            TextUtils.isEmpty(newVersion) -> throw IllegalArgumentException("Manifest must provide version parameter!")
            TextUtils.isEmpty(lastVersion) -> true
            else -> newVersion == lastVersion
        }
    }
}
