// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.net.Uri
import android.util.Log
import androidx.core.net.toUri
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONException
import org.json.JSONObject
import kotlinx.coroutines.CompletableDeferred
import java.util.concurrent.TimeUnit

class ExponentPackageLogger private constructor(private val appUrl: Uri) {
  enum class LogLevel {
    WARNING,
    ERROR,
    INFO
  }

  private var okHttpClient: OkHttpClient = OkHttpClient.Builder()
    .connectTimeout(10, TimeUnit.SECONDS)
    .writeTimeout(10, TimeUnit.SECONDS)
    .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
    .build()

  private var webSocket: WebSocket? = null
  private var connected: Boolean = false
  private var pendingMessage: String? = null
  private var logLevel: LogLevel = LogLevel.INFO

  private suspend fun sendMessage(message: String, logLevel: LogLevel) {
    pendingMessage = message
    this.logLevel = logLevel

    val request: Request = Request.Builder().url(getMessageSocketUrl(appUrl)).build()

    val latch = CompletableDeferred<Unit>()

    okHttpClient.newWebSocket(
      request,
      object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
          connected = true
          this@ExponentPackageLogger.webSocket = webSocket
          sendPendingMessage()
          latch.complete(Unit)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
          Log.e(TAG, "Error opening web socket to url: ${getMessageSocketUrl(appUrl)}")
          latch.completeExceptionally(t)
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
          connected = false
        }
      }
    )

    latch.await()
  }

  private fun sendPendingMessage() {
    if (!connected) {
      return
    }

    if (pendingMessage != null && webSocket != null) {
      val msg = mapOf(
        "type" to "log",
        "level" to when (logLevel) {
          LogLevel.WARNING -> "warn"
          LogLevel.ERROR -> "error"
          LogLevel.INFO -> "info"
        },
        "data" to arrayOf(pendingMessage)
      )

      try {
        val json = JSONObject(msg).toString()
        webSocket?.send(json)
      } catch (e: JSONException) {
        Log.e(TAG, "Failed to stringify message: ${e.message}")
      }
      pendingMessage = null
      try {
        webSocket?.close(1000, "End of session")
      } catch (e: Exception) {
        // swallow, no need to handle it here
      }
      webSocket = null
      connected = false
    }
  }

  private fun getMessageSocketUrl(appUrl: Uri): String {
    val host = appUrl.host ?: "localhost"
    val port = if (appUrl.port > 0) appUrl.port else 8081
    val scheme = if (appUrl.scheme == "https") "wss" else "ws"
    return "$scheme://$host:$port/hot"
  }

  companion object {
    private val TAG = ExponentPackageLogger::class.java.simpleName

    /**
     * Sends a message to the packager with the given url.
     * @param appUrl packager url
     * @param message message to send
     * @param logLevel log level to use, will be sent to the packager which can format or
     * display different log levels in different ways.
     */
    suspend fun send(appUrl: String, message: String, logLevel: LogLevel) {
      val logger = ExponentPackageLogger(appUrl.toUri())
      try {
        logger.sendMessage(message, logLevel)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to send message: ${e.message}")
      }
    }
  }
}
