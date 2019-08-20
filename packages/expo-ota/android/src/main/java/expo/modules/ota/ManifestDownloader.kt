package expo.modules.ota

import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.lang.Exception
import java.lang.IllegalStateException

class ManifestDownloader(val url: String, val headers: Map<String, String>, okHttpClient: OkHttpClient?) {

    interface ManifestDownloadCallback {
        fun onSuccess(manifest: JSONObject)
        fun onError(error: Exception)
    }

    private fun createRequest(): Request {
        val requestBuilder = Request.Builder()
        requestBuilder.url(url)
        headers.forEach { requestBuilder.addHeader(it.key, it.value) }
        return requestBuilder.build()
    }

    fun downloadManifest(callback: ManifestDownloadCallback) {
        httpClient.newCall(createRequest()).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback.onError(IllegalStateException("Manifest fetching failed: ", e))
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    if (response.body() != null) {
                        callback.onSuccess(JSONObject(response.body()!!.string()))
                    } else {
                        callback.onError(IllegalStateException("Response body is null: ", response.body()))
                    }
                } else {
                    callback.onError(IllegalStateException("Response not successful. Code: " + response.code() + ", body: " + response.body()?.toString()))
                }
            }
        })
    }

    private val httpClient = okHttpClient ?: OkHttpClient()

}