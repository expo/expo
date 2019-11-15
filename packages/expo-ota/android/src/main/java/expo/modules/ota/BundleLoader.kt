package expo.modules.ota

import okhttp3.*
import java.io.File
import java.io.IOException
import java.io.InputStream

class BundleLoader(private val httpClient: OkHttpClient) {

    data class BundleLoadParams(val url: String,
                                val directory: File,
                                val fileName: String)

    fun loadJsBundle(params: BundleLoadParams, success: (BundleLoadParams, InputStream) -> Unit, error: (Exception?) -> Unit): Boolean {
        val requestBuilder: Request.Builder = Request.Builder().url(params.url)

        downloadBundle(requestBuilder.build(), this.handleResponse(params, success, error), error)

        val sourceFile = File(params.directory, params.fileName)
        return sourceFile.exists()
    }

    private fun downloadBundle(request: Request, success: (Response) -> Unit, error: (java.lang.Exception?) -> Unit) {
        val builder = request.newBuilder()
        httpClient.newCall(builder.build()).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                error(e)
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    success(response)
                } else {
                    error(IOException("Response unsuccessful! Code: ${response.code()}, body: ${response.body().toString()} "))
                }
            }
        })
    }

    private fun handleResponse(params: BundleLoadParams, success: (BundleLoadParams, InputStream) -> Unit, error: (Exception?) -> Unit): (Response) -> Unit =
            { response: Response ->
                if (!response.isSuccessful) {
                    handleUnsuccessfulResponse(response, error)
                } else {
                    try {
                        success(params, response.body()!!.byteStream())
                    } catch (e: Exception) {
                        error(e)
                    }
                }
            }

    private fun handleUnsuccessfulResponse(response: Response, error: (Exception?) -> Unit) {
        var body = "(could not render body)"
        try {
            body = response.body()!!.string()
        } catch (ignore: IOException) {
        }
        error(Exception("Bundle return code: " + response.code() +
                ". With body: " + body))
    }

}

