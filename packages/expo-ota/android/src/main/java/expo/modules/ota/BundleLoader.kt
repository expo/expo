package expo.modules.ota

import android.content.Context
import android.util.Log
import okhttp3.CacheControl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.apache.commons.io.output.TeeOutputStream
import java.io.*
import java.util.*

class BundleLoader(val context: Context, val httpClient: OkHttpClient) {

    data class BundleLoadParams(val url: String,
                                val directory: File,
                                val fileName: String,
                                val fallbackBundleResponses: List<EmbeddedResponse>,
                                val shouldForceNetwork: Boolean = false)

    fun loadJsBundle(params: BundleLoadParams, success: (String) -> Unit, error: (Exception?) -> Unit): Boolean {
        if (!params.directory.exists()) {
            params.directory.mkdir()
        }

        val requestBuilder: Request.Builder = Request.Builder().url(params.url)
        if (params.shouldForceNetwork) {
            requestBuilder.cacheControl(CacheControl.FORCE_NETWORK)
        }

        val fallbackResponses = LinkedList<BundleDownloader.FallbackResponse>()
        for (response in params.fallbackBundleResponses) {
            fallbackResponses.addLast(BundleDownloader.FallbackResponse(response.url, response.mediaType, response.responseFilePath))
        }

        val bundleDownloader = BundleDownloader(context, httpClient, fallbackResponses)
        // TODO: Looks like there is at least one more case to be considered from below if :|
        bundleDownloader.downloadBundle(requestBuilder.build(), params.shouldForceNetwork, this.handleResponse(params, success, error), error)

        //      if (shouldForceCache) {
//        mExponentNetwork.getLongTimeoutClient().tryForcedCachedResponse(request.url().toString(), request, callback, null, null);
//      } else if (shouldForceNetwork) {
//        mExponentNetwork.getLongTimeoutClient().callSafe(request, callback);
//      } else {
//        mExponentNetwork.getLongTimeoutClient().callDefaultCache(request, callback);
//      }


        val sourceFile = File(params.directory, params.fileName)
        return sourceFile.exists()
    }

    fun removeFile(path: String) {
        val file = File(path)
        file.delete()
    }

    private fun handleResponse(params: BundleLoadParams, success: (String) -> Unit, error: (Exception?) -> Unit): (Response, BundleDownloader.ResponseSource) -> Unit =
            { response: Response, source: BundleDownloader.ResponseSource ->
                when (source) {
                    BundleDownloader.ResponseSource.CACHE,
                    BundleDownloader.ResponseSource.EMBEDDED -> {
                        // TODO: Analytics
                    }
                }
                if (!response.isSuccessful) {
                    handleUnsuccessfulResponse(response, error)
                } else {
                    try {
                        val sourceFile = File(params.directory, params.fileName)
                        var hasCachedSourceFile = false

                        if (response.networkResponse() != null && response.networkResponse()?.code() == 304) {
                            if (sourceFile.exists()) {
                                hasCachedSourceFile = true
                            }
                        }

                        if (!hasCachedSourceFile) {
                            try {
                                val inputStream = response.body()!!.byteStream()
                                val fileOutputStream = FileOutputStream(sourceFile)
                                val byteArrayOutputStream = ByteArrayOutputStream()
                                val teeOutputStream = TeeOutputStream(fileOutputStream, byteArrayOutputStream)

                                copy(inputStream, teeOutputStream)

                                fileOutputStream.flush()
                                fileOutputStream.fd.sync()

                            } catch (e: Exception) {
                                Log.e("TAGG", "Waaaat!?", e)
                            } finally {
                                Log.e("TAGG", "Waaaat!?")
                            }
                        }

                        success(sourceFile.absolutePath)
                    } catch (e: Exception) {
                        error(e)
                    }
                }
            }

    private fun handleUnsuccessfulResponse(response: Response, error: (Exception?) -> Unit) {
        var body = "(could not render body)"
        try {
            body = response.body()!!.string()
        } catch (e: IOException) {
            // TODO: Analytics
        }

        error(Exception("Bundle return code: " + response.code() +
                ". With body: " + body))
    }

    @Throws(IOException::class)
    fun copy(from: InputStream, to: OutputStream): Long {
        val buf = ByteArray(0x1000)
        var total: Long = 0
        while (true) {
            val r = from.read(buf)
            if (r == -1) {
                break
            }
            to.write(buf, 0, r)
            total += r.toLong()
        }
        return total
    }

}

data class EmbeddedResponse(val url: String, val responseFilePath: String, val mediaType: String)
