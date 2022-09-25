package expo.modules.devlauncher.logs

import android.net.Uri
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class DevLauncherRemoteLogManager(private val httpClient: OkHttpClient, private val url: Uri) : WebSocketListener() {
  private val batch: MutableList<String> = mutableListOf()

  fun deferError(throwable: Throwable) {
    batch.add(throwable.toRemoteLogString())
  }

  fun deferError(message: String) {
    batch.add(message)
  }

  fun sendViaWebSocket() {
    val request = Request.Builder().url(url.toString()).build()
    httpClient.newWebSocket(request, this)
  }

  override fun onOpen(webSocket: WebSocket, response: Response) {
    webSocket.send(DevLauncherRemoteLog(batch).toJson())
    webSocket.close(1000, null)
    batch.clear()
  }
}

internal fun Throwable.toRemoteLogString(): String {
  val separator = "\n  "
  val baseTrace = stackTrace.joinToString(separator) {
    it.toString()
  }
  val remoteLogString = "$this$separator$baseTrace"

  cause?.let {
    return "$remoteLogString\nCaused by ${it.toRemoteLogString()}"
  }

  return remoteLogString
}
