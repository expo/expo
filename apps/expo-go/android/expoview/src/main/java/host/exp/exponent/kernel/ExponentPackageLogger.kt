// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.net.Uri
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONException
import org.json.JSONObject
import java.util.concurrent.CompletableFuture
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

  private fun sendMessage(message: String, logLevel: LogLevel): CompletableFuture<Void> {
    val future = CompletableFuture<Void>()
    pendingMessage = message
    this.logLevel = logLevel

    val request: Request = Request.Builder().url(getMessageSocketUrl(appUrl)).build()
    okHttpClient.newWebSocket(
      request,
      object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
          connected = true
          this@ExponentPackageLogger.webSocket = webSocket
          sendPendingMessage()
          future.complete(null)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
          Log.e(TAG, "Error opening web socket to url: ${getMessageSocketUrl(appUrl)}")
          future.completeExceptionally(t)
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
          connected = false
        }
      }
    )

    return future
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

    fun send(appUrl: Uri, message: String, logLevel: LogLevel) {
      val logger = ExponentPackageLogger(appUrl)
      logger.sendMessage(message, logLevel)
        .thenAccept { /* Success - no further action needed */ }
        .exceptionally {
          Log.e(TAG, "Failed to send message: ${it.message}")
          null
        }
    }
  }
}
