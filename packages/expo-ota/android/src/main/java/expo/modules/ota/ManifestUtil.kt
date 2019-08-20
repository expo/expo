package expo.modules.ota

import android.text.TextUtils
import org.json.JSONObject
import java.lang.IllegalArgumentException
import java.util.*

interface ManifestComparator {
    fun shouldDownloadBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean
}

class VersionNumberManifestCompoarator: ManifestComparator {
    override fun shouldDownloadBundle(lastManifest: JSONObject, newManifest: JSONObject): Boolean {
        val newVersion = newManifest.optString("version", "")
        val lastVersion = lastManifest.optString("version", "")
        return when {
            TextUtils.isEmpty(newVersion) -> throw IllegalArgumentException("Manifest must provide version parameter!")
            TextUtils.isEmpty(lastVersion) -> true
            else -> compareVersions(newVersion, lastVersion) > 0
        }
    }

    private fun compareVersions(version1: String, version2: String): Int {
        val versions1 = version1.split(".").toList()
        val versions2 = if (TextUtils.isEmpty(version2)) {
            Collections.emptyList<String>()
        } else {
            version2.split(".").toList()
        }
        for (i in 0..versions1.size) {
            if(i > versions2.size - 1) return 1
            val first = Integer.parseInt(versions1[i])
            val second = Integer.parseInt(versions2[i])
            val result = first.compareTo(second)
            if (result != 0) return result
        }
        return versions1.size.compareTo(versions2.size)
    }

}
