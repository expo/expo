package expo.embedding

import android.net.Uri
import java.io.IOException
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import okhttp3.Call
import okhttp3.Callback
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response

internal object ExpoMetroConnection {
  private val client = OkHttpClient.Builder().callTimeout(1, TimeUnit.SECONDS).build()

  fun findServer(defaultUrl: HttpUrl, projectRoot: String): CompletableFuture<HttpUrl?> {
    val candidates = if (defaultUrl.host in setOf("10.0.2.2", "10.0.3.2")) {
      // adb reverse works even when the emulator cannot reach the host's LAN interface.
      listOf(defaultUrl, defaultUrl.newBuilder().host("127.0.0.1").build())
    } else {
      listOf(defaultUrl)
    }
    val result = CompletableFuture<HttpUrl?>()
    val remaining = AtomicInteger(candidates.size)
    fun unavailable() {
      if (remaining.decrementAndGet() == 0) result.complete(null)
    }
    for (url in candidates) {
      client.newCall(Request.Builder().url(url).build()).enqueue(object : Callback {
        override fun onFailure(call: Call, error: IOException) = unavailable()

        override fun onResponse(call: Call, response: Response) {
          response.use {
            try {
              if (response.isSuccessful &&
                Uri.decode(response.header("X-React-Native-Project-Root")) == projectRoot &&
                response.body?.string() == "packager-status:running"
              ) {
                result.complete(url)
              } else {
                unavailable()
              }
            } catch (_: IOException) {
              unavailable()
            }
          }
        }
      })
    }
    return result
  }
}
