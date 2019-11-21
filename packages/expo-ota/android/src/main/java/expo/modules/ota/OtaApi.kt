package expo.modules.ota

import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.io.InputStream

interface OtaApi {

    fun manifest(success: (JSONObject) -> Unit, error: (Exception?) -> Unit)

    fun bundle(url: String, success: (InputStream) -> Unit, error: (Exception?) -> Unit)

}

class ExpoOtaApi(
        private val manifestHttpClient: OkHttpClient,
        private val manifestUrl: String,
        private val manifestHeaders: Map<String, String>,
        private val bundleHttpClient: OkHttpClient
) : OtaApi {

    private fun createManifestRequest(url: String, headers: Map<String, String>): Request {
        val requestBuilder = Request.Builder()
        requestBuilder.url(url)
        headers.forEach { requestBuilder.addHeader(it.key, it.value) }
        return requestBuilder.build()
    }

    override fun manifest(success: (JSONObject) -> Unit, error: (Exception?) -> Unit) {
        manifestHttpClient.newCall(createManifestRequest(manifestUrl, manifestHeaders)).enqueue(object : Callback {
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
        }) //To change body of created functions use File | Settings | File Templates.
    }

    override fun bundle(url: String, success: (InputStream) -> Unit, error: (Exception?) -> Unit) {
        val requestBuilder: Request.Builder = Request.Builder().url(url)
        bundleHttpClient.newCall(requestBuilder.build()).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                error(e)
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    success(response.body()!!.byteStream())
                } else {
                    var body = "(could not render body)"
                    try {
                        body = response.body()!!.string()
                    } catch (ignore: IOException) {
                    }
                    error(Exception("Bundle return code: " + response.code() +
                            ". With body: " + body))
                }
            }
        })
    }
}