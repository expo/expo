package expo.modules.ota

import android.content.Context
import org.json.JSONObject
import java.io.InputStream
import java.io.InputStreamReader

class EmbeddedManifestAndBundle(val context: Context) {

    fun readManifest(): JSONObject {
        val manifestReader = InputStreamReader(context.assets.open("shell-app-manifest.json"))
        val stringBuilder = StringBuilder()
        manifestReader.forEachLine {
            stringBuilder.append(it).append("\n")
        }
        return JSONObject(stringBuilder.deleteCharAt(stringBuilder.length - 1).toString())
    }

    fun readBundle(): InputStream {
        return context.assets.open("shell-app.bundle")
    }

    fun isEmbeddedManifestCompatibleWith(manifest: JSONObject): Boolean {
        val sdkVersion = manifest.optString("sdkVersion")
        val releaseChannel = manifest.optString("releaseChannel")
        if (sdkVersion == null || releaseChannel == null) {
            return false
        }
        return readManifest().getString("sdkVersion") == sdkVersion
                && readManifest().getString("releaseChannel") == releaseChannel
    }

}