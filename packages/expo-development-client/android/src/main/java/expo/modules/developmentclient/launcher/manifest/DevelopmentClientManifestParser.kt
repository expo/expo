package expo.modules.developmentclient.launcher.manifest

import com.google.gson.Gson
import expo.modules.developmentclient.helpers.await
import expo.modules.developmentclient.helpers.fetch
import okhttp3.OkHttpClient
import java.io.Reader

class DevelopmentClientManifestParser(
  private val httpClient: OkHttpClient,
  private val url: String
) {
  suspend fun isManifestUrl(): Boolean {
    val response = fetch(url, "HEAD").await(httpClient)
    require(response.isSuccessful) { "Make sure that the metro bundler is running." }
    return response.header("Exponent-Server", null) != null
  }

  private suspend fun downloadManifest(): Reader {
    val response = fetch(url, "GET").await(httpClient)
    require(response.isSuccessful)
    return response.body!!.charStream()
  }

  suspend fun parseManifest(): DevelopmentClientManifest {
    val manifestReader = downloadManifest()
    return Gson().fromJson(manifestReader, DevelopmentClientManifest::class.java)
  }
}
