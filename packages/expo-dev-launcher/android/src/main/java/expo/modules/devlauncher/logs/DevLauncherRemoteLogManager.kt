package expo.modules.devlauncher.logs

import android.net.Uri
import android.util.Log
import expo.modules.devlauncher.koin.DevLauncherKoinContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class DevLauncherRemoteLogManager private constructor(private val httpClient: OkHttpClient, private val url: Uri) : WebSocketListener() {
  private val batch: MutableList<DevLauncherRemoteLog> = mutableListOf()
  private var ws: WebSocket? = null
  private var isOpen = false

  @Synchronized
  fun sendError(throwable: Throwable) {
    batch.add(DevLauncherRemoteLog(throwable))
    if (isOpen) {
      sendMessages(ws)
    } else {
      openWebSocket()
    }
  }

  @Synchronized
  fun sendError(message: String) {
    batch.add(DevLauncherRemoteLog(message))
    if (isOpen) {
      sendMessages(ws)
    } else {
      openWebSocket()
    }
  }

  @Synchronized
  fun openWebSocket() {
    val request = Request.Builder().url(url.toString()).build()
    ws = httpClient.newWebSocket(request, this)
  }

  @Synchronized
  fun closeWebSocket() {
    isOpen = false
    ws?.close(1000, null)
  }

  @Synchronized
  fun sendMessages(webSocket: WebSocket?) {
    webSocket?.let { socket ->
      batch.forEach { log ->
        socket.send(log.toJson())
      }
      batch.clear()
    }
  }

  @Synchronized
  override fun onOpen(webSocket: WebSocket, response: Response) {
    sendMessages(webSocket)
    isOpen = true
  }

  companion object {
    private val map: MutableMap<String, DevLauncherRemoteLogManager> = mutableMapOf()

    fun forUrl(url: Uri): DevLauncherRemoteLogManager {
      val key = url.toString()
      if (!map.containsKey(key)) {
        map[key] = DevLauncherRemoteLogManager(DevLauncherKoinContext.app.koin.get(), url)
      }
      return map[key]!!
    }

    fun closeAll() {
      map.forEach {
        it.value.closeWebSocket()
      }
      val httpClient = DevLauncherKoinContext.app.koin.get<OkHttpClient>()
      httpClient.dispatcher().executorService().shutdown()
    }
  }
}
