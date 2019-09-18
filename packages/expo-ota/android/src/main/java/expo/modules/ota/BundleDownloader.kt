package expo.modules.ota

import android.content.Context
import okhttp3.*
import okio.BufferedSource
import okio.Okio
import java.io.FileNotFoundException
import java.io.IOException

class BundleDownloader(private val context: Context, private val okHttpClient: OkHttpClient, private val fallbackResponses: List<FallbackResponse>) {

    private var executed = false
    private var responseYielded = false

    private var obtainedResponse: Response? = null
    private var responseSource: ResponseSource? = null
    private var error: Exception? = null
    private var success: ((Response, ResponseSource) -> Unit)? = null
    private var errorHandler: ((Exception?) -> Unit)? = null

    class FallbackResponse(val url: String, val mediaType: String, val filePath: String)

    enum class ResponseSource {
        NETWORK, CACHE, EMBEDDED
    }

    fun downloadBundle(request: Request, shouldForceNetwork: Boolean, success: (Response, ResponseSource) -> Unit, error: (java.lang.Exception?) -> Unit) {
        if (executed) {
            throw IllegalStateException("Create new BundleDownloader for new download!")
        } else {
            executed = true
        }

        this.errorHandler = error
        this.success = success
        tryDownload(request, shouldForceNetwork)
    }

    private fun tryDownload(request: Request, shouldForceNetwork: Boolean) {
        val builder = request.newBuilder()
        if (shouldForceNetwork) {
            builder.cacheControl(CacheControl.FORCE_NETWORK).build()
        }

        okHttpClient.newCall(builder.build()).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                chainError(e)
                tryForceCache(call.request())
            }

            override fun onResponse(call: Call, response: Response) {
                this@BundleDownloader.obtainedResponse = response
                this@BundleDownloader.responseSource = ResponseSource.NETWORK
                if (response.isSuccessful) {
                    yieldResponse()
                } else {
                    tryForceCache(call.request())
                }
            }
        })
    }

    private fun chainError(e: IOException) {
        if (this.error != null) {
            e.initCause(this.error)
        }
        this.error = e
    }

    private fun yieldResponse() {
        if (responseYielded) {
            throw IllegalStateException("Trying to respond second time from the same request!")
        }
        if (obtainedResponse==null || responseSource == null) {
            throw IllegalStateException("Trying to respond without either response or its source! Response: $obtainedResponse, source: $responseSource")
        } else {
            responseYielded = true
            success?.let { it(obtainedResponse!!, responseSource!!) }
        }
    }

    private fun yieldError() {
        if (responseYielded) {
            throw IllegalStateException("Trying to respond second time from the same request!")
        }
        responseYielded = true
        errorHandler?.let { it(this.error) }
    }

    private fun tryForceCache(request: Request) {
        val requestBuilder = request.newBuilder()
                .cacheControl(CacheControl.FORCE_CACHE)
                .header("exponentignoreinterceptors", "blah")

        okHttpClient.newCall(requestBuilder.build()).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                chainError(e)
                tryHardcodedResponse(call.request())
            }

            override fun onResponse(call: Call, response: Response) {
                this@BundleDownloader.obtainedResponse = response
                this@BundleDownloader.responseSource = ResponseSource.CACHE
                if (response.isSuccessful) {
                    yieldResponse()
                } else {
                    tryHardcodedResponse(call.request())
                }
            }
        })
    }

    private fun tryHardcodedResponse(request: Request) {
        try {
            for (embeddedResponse in fallbackResponses) {
                val normalizedUri = normalizeUri(request.url())
                // We only want to use embedded responses once. After they are used they will be added
                // to the OkHttp cache and we should use the version from that cache. We don't want a situation
                // where we have version 1 of a manifest saved as the embedded response, get version 2 saved
                // to the OkHttp cache, cache gets evicted, and we regress to version 1. Want to only use
                // monotonically increasing manifest versions.
                if (normalizedUri == normalizeUri(HttpUrl.get(embeddedResponse.url))) {
                    val response = Response.Builder()
                            .request(request)
                            .protocol(Protocol.HTTP_1_1)
                            .code(200)
                            .message("OK")
                            .body(responseBodyForFile(embeddedResponse.filePath, MediaType.parse(embeddedResponse.mediaType)))
                            .build()
                    this.obtainedResponse = response
                    this.responseSource = ResponseSource.EMBEDDED
                    yieldResponse()
                    return
                }
            }
        } catch (ignore: Throwable) {
        }

        when {
            obtainedResponse != null -> yieldResponse()
            error != null -> yieldError()
            else -> {
                chainError(IOException("No hard coded response found"))
                yieldError()
            }
        }
    }

    private fun responseBodyForFile(assetsPath: String, contentType: MediaType?): ResponseBody? {
        try {
            var strippedAssetsPath = assetsPath
            if (strippedAssetsPath.startsWith("assets://")) {
                strippedAssetsPath = strippedAssetsPath.substring("assets://".length)
            }

            val stream = context.assets.open(strippedAssetsPath)
            val source = Okio.source(stream)
            val buffer = Okio.buffer(source)

            return object : ResponseBody() {
                override fun contentType(): MediaType? {
                    return contentType
                }

                override fun contentLength(): Long {
                    return -1
                }

                override fun source(): BufferedSource {
                    return buffer
                }
            }
        } catch (e: FileNotFoundException) {
            return null
        } catch (e: IOException) {
            return null
        }

    }

    private fun normalizeUri(url: HttpUrl): String {
        var port = url.port()
        if (port == -1) {
            if (url.scheme() == "http") {
                port = 80
            } else if (url.scheme() == "https") {
                port = 443
            }
        }

        val urlBuilder = url.newBuilder()
        urlBuilder.port(port)

        return urlBuilder.build().toString()
    }

}
