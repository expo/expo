// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.network

import android.content.Context
import host.exp.exponent.analytics.EXL
import okhttp3.*
import okio.BufferedSource
import okio.buffer
import okio.source
import java.io.FileNotFoundException
import java.io.IOException
import java.net.MalformedURLException
import java.net.URI
import java.net.URISyntaxException
import java.net.URL

class ExponentHttpClient(
  private val context: Context,
  private val okHttpClientFactory: ExponentNetwork.OkHttpClientFactory
) {
  interface SafeCallback {
    fun onFailure(e: IOException)
    fun onResponse(response: ExpoResponse)
    fun onCachedResponse(response: ExpoResponse, isEmbedded: Boolean)
  }

  fun call(request: Request, callback: ExpoHttpCallback) {
    okHttpClientFactory.getNewClient().newCall(request).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        callback.onFailure(e)
      }

      @Throws(IOException::class)
      override fun onResponse(call: Call, response: Response) {
        callback.onResponse(OkHttpV1ExpoResponse(response))
      }
    })
  }

  fun callSafe(request: Request, callback: SafeCallback) {
    val uri = request.url.toString()
    okHttpClientFactory.getNewClient().newCall(request).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        tryForcedCachedResponse(uri, request, callback, null, e)
      }

      @Throws(IOException::class)
      override fun onResponse(call: Call, response: Response) {
        if (response.isSuccessful) {
          callback.onResponse(OkHttpV1ExpoResponse(response))
        } else {
          tryForcedCachedResponse(uri, request, callback, response, null)
        }
      }
    })
  }

  fun callDefaultCache(request: Request, callback: SafeCallback) {
    tryForcedCachedResponse(
      request.url.toString(),
      request,
      object : SafeCallback {
        override fun onFailure(e: IOException) {
          call(
            request,
            object : ExpoHttpCallback {
              override fun onFailure(e: IOException) {
                callback.onFailure(e)
              }

              @Throws(IOException::class)
              override fun onResponse(response: ExpoResponse) {
                callback.onResponse(response)
              }
            }
          )
        }

        override fun onResponse(response: ExpoResponse) {
          callback.onResponse(response)
        }

        override fun onCachedResponse(response: ExpoResponse, isEmbedded: Boolean) {
          callback.onCachedResponse(response, isEmbedded)
          // You are responsible for updating the cache!
        }
      },
      null,
      null
    )
  }

  fun tryForcedCachedResponse(
    uri: String,
    request: Request,
    callback: SafeCallback,
    initialResponse: Response?,
    initialException: IOException?
  ) {
    val newRequest = request.newBuilder()
      .cacheControl(CacheControl.FORCE_CACHE)
      .header(ExponentNetwork.IGNORE_INTERCEPTORS_HEADER, "blah")
      .build()

    okHttpClientFactory.getNewClient().newCall(newRequest).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        tryHardCodedResponse(uri, call, callback, initialResponse, initialException)
      }

      @Throws(IOException::class)
      override fun onResponse(call: Call, response: Response) {
        if (response.isSuccessful) {
          callback.onCachedResponse(OkHttpV1ExpoResponse(response), false)
        } else {
          tryHardCodedResponse(uri, call, callback, initialResponse, initialException)
        }
      }
    })
  }

  private fun tryHardCodedResponse(
    uri: String,
    call: Call,
    callback: SafeCallback,
    initialResponse: Response?,
    initialException: IOException?
  ) {
    when {
      initialResponse != null -> callback.onResponse(OkHttpV1ExpoResponse(initialResponse))
      initialException != null -> callback.onFailure(initialException)
      else -> callback.onFailure(IOException("No hard coded response found"))
    }
  }

  private fun responseBodyForFile(assetsPath: String, contentType: MediaType?): ResponseBody? {
    return try {
      var strippedAssetsPath = assetsPath
      if (strippedAssetsPath.startsWith("assets://")) {
        strippedAssetsPath = strippedAssetsPath.substring("assets://".length)
      }

      val stream = context.assets.open(strippedAssetsPath)
      val source = stream.source()
      val buffer = source.buffer()

      object : ResponseBody() {
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
      EXL.e(TAG, e)
      null
    } catch (e: IOException) {
      EXL.e(TAG, e)
      null
    }
  }

  companion object {
    private val TAG = ExponentHttpClient::class.java.simpleName

    private fun normalizeUri(uriString: String): String {
      return try {
        val url = URL(uriString)
        var port = url.port
        if (port == -1) {
          if (url.protocol == "http") {
            port = 80
          } else if (url.protocol == "https") {
            port = 443
          }
        }
        val uri = URI(url.protocol, url.userInfo, url.host, port, url.path, url.query, url.ref)
        uri.toString()
      } catch (e: MalformedURLException) {
        uriString
      } catch (e: URISyntaxException) {
        uriString
      }
    }
  }
}
