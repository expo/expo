package expo.modules.devlauncher.logs

import android.net.Uri
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class DevLauncherRemoteLogManager(private val httpClient: OkHttpClient, private val url: Uri) : WebSocketListener() {
  private val batch: MutableList<DevLauncherRemoteLog> = mutableListOf()

  fun deferError(throwable: Throwable) {
    batch.add(DevLauncherRemoteLog(throwable))
  }

  fun deferError(message: String) {
    batch.add(DevLauncherRemoteLog(message))
  }

  fun sendViaWebSocket() {
    val request = Request.Builder().url(url.toString()).build()
    httpClient.newWebSocket(request, this)

    httpClient.dispatcher().executorService().shutdown()
  }

  override fun onOpen(webSocket: WebSocket, response: Response) {
    batch.forEach {
      webSocket.send(it.toJson())
    }
    webSocket.close(1000, null)
    batch.clear()
  }
}
