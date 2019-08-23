package expo.modules.ota

import okhttp3.*
import org.json.JSONObject
import java.io.IOException

private fun createRequest(config: ManifestDownloadParams): Request {
    val requestBuilder = Request.Builder()
    requestBuilder.url(config.url)
    config.headers.forEach { requestBuilder.addHeader(it.key, it.value) }
    return requestBuilder.build()
}

fun downloadManifest(params: ManifestDownloadParams, success: (JSONObject) -> Unit, error: (Exception) -> Unit) {
    httpClient(params).newCall(createRequest(params)).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            error(IllegalStateException("Manifest fetching failed: ", e))
        }

        override fun onResponse(call: Call, response: Response) {
            if (response.isSuccessful) {
                if (response.body() != null) {
                    success(JSONObject(response.body()!!.string()))
                } else {
                    error(IllegalStateException("Response body is null: ", response.body()))
                }
            } else {
                error(IllegalStateException("Response not successful. Code: " + response.code() + ", body: " + response.body()?.toString()))
            }
        }
    })
}

private fun httpClient(params: ManifestDownloadParams) = params.okHttpClient ?: OkHttpClient()
