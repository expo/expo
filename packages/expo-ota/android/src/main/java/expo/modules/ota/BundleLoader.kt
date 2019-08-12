package expo.modules.ota

import android.content.Context
import android.os.Handler
import android.util.Log
import okhttp3.CacheControl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.apache.commons.io.output.TeeOutputStream
import java.io.*
import java.lang.Exception
import java.util.*

class BundleLoader(val context: Context, val httpClient: OkHttpClient) {

    data class BundleLoadParams(val url: String,
                                val directory: File,
                                val fileName: String?,
                                val fallbackBundleResponses: List<EmbeddedResponse>,
                                val shouldForceNetwork: Boolean = false)

    interface BundleLoadCallback {
        fun bundleLoaded(path: String)
        fun error(e: Exception)
    }

    fun loadJsBundle(params: BundleLoadParams, callback: BundleLoadCallback): Boolean {
        if (!params.directory.exists()) {
            params.directory.mkdir()
        }

        val requestBuilder: Request.Builder = Request.Builder().url(params.url)
        if (params.shouldForceNetwork) {
            requestBuilder.cacheControl(CacheControl.FORCE_NETWORK)
        }

        val downloadCallback = object : BundleDownloader.BundleDownloadCallback {
            override fun onSuccess(response: Response, source: BundleDownloader.ResponseSource?) {
                when (source) {
                    BundleDownloader.ResponseSource.CACHE,
                    BundleDownloader.ResponseSource.EMBEDDED -> {
                        // TODO: Analytics
                    }
                }

                if (!response.isSuccessful) {
                    var body = "(could not render body)"
                    try {
                        body = response.body()!!.string()
                    } catch (e: IOException) {
                        // TODO: Analytics
                    }

                    callback.error(Exception("Bundle return code: " + response.code() +
                            ". With body: " + body))
                    return
                }

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

                    callback.bundleLoaded(sourceFile.absolutePath)
                } catch (e: Exception) {
                    callback.error(e)
                }

            }

            override fun onError(error: Exception) {
                callback.error(error)
            }
        }

        val fallbackResponses = LinkedList<BundleDownloader.FallbackResponse>()
        for (response in params.fallbackBundleResponses) {
            fallbackResponses.addLast(BundleDownloader.FallbackResponse(response.url, response.mediaType, response.responseFilePath))
        }

        val bundleDownloader = BundleDownloader(context, httpClient, fallbackResponses)
        // TODO: Looks like there is at least one more case to be considered from below if :|
        bundleDownloader.downloadBundle(requestBuilder.build(), params.shouldForceNetwork, null, downloadCallback)

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
