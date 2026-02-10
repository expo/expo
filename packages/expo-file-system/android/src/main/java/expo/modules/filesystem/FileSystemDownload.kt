package expo.modules.filesystem

import android.webkit.URLUtil
import expo.modules.interfaces.filesystem.Permission
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.URI
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Tracks active OkHttp calls by UUID so they can be cancelled from JS via `cancelDownloadAsync`.
 */
class DownloadTaskStore {
  private val activeCalls = ConcurrentHashMap<String, Call>()

  fun store(call: Call, forUuid: String) {
    activeCalls[forUuid] = call
  }

  fun cancel(uuid: String) {
    activeCalls.remove(uuid)?.cancel()
  }

  fun remove(uuid: String) {
    activeCalls.remove(uuid)
  }
}

/**
 * Executes a file download with optional progress reporting.
 *
 * When [downloadUuid] is non-null, the response body is streamed through a manual byte-copy loop
 * that emits `downloadProgress` events via [emitProgress]. Progress events are throttled to fire at
 * most once every [PROGRESS_THROTTLE_MS] milliseconds; a final event is always sent when the
 * download is complete (i.e. `totalRead == contentLength`).
 *
 * When [downloadUuid] is null the response body is copied with `InputStream.copyTo` and no progress
 * events are emitted.
 */
suspend fun downloadFileWithStore(
  url: URI,
  to: FileSystemPath,
  options: DownloadOptions?,
  downloadUuid: String?,
  downloadStore: DownloadTaskStore,
  emitProgress: (uuid: String, bytesWritten: Long, totalBytes: Long) -> Unit
): URI {
  to.validatePermission(Permission.WRITE)

  val requestBuilder = Request.Builder().url(url.toURL())
  options?.headers?.forEach { (key, value) ->
    requestBuilder.addHeader(key, value)
  }

  val request = requestBuilder.build()
  val client = OkHttpClient()

  val response: Response = suspendCancellableCoroutine { continuation ->
    val call = client.newCall(request)

    if (downloadUuid != null) {
      downloadStore.store(call, downloadUuid)
    }

    continuation.invokeOnCancellation {
      call.cancel()
      if (downloadUuid != null) {
        downloadStore.remove(downloadUuid)
      }
    }

    call.enqueue(object : Callback {
      override fun onResponse(call: Call, response: Response) {
        continuation.resume(response)
      }
      override fun onFailure(call: Call, e: IOException) {
        if (!continuation.isCancelled) {
          continuation.resumeWithException(e)
        }
      }
    })
  }

  try {
    if (!response.isSuccessful) {
      throw UnableToDownloadException("response has status: ${response.code}")
    }

    val contentDisposition = response.headers["content-disposition"]
    val contentType = response.headers["content-type"]
    val fileName = URLUtil.guessFileName(url.toString(), contentDisposition, contentType)

    val destination = if (to is FileSystemDirectory) {
      File(to.javaFile, fileName)
    } else {
      to.javaFile
    }

    if (options?.idempotent != true && destination.exists()) {
      throw DestinationAlreadyExistsException()
    }

    val body = response.body ?: throw UnableToDownloadException("response body is null")
    body.byteStream().use { input ->
      FileOutputStream(destination).use { output ->
        if (downloadUuid != null) {
          streamWithProgress(input, output, body.contentLength(), downloadUuid, emitProgress)
        } else {
          input.copyTo(output)
        }
      }
    }
    return destination.toURI()
  } finally {
    if (downloadUuid != null) {
      downloadStore.remove(downloadUuid)
    }
  }
}

/** Minimum interval between progress events in milliseconds. */
private const val PROGRESS_THROTTLE_MS = 100L

/**
 * Copies bytes from [input] to [output] while emitting throttled progress events.
 *
 * Events fire when at least [PROGRESS_THROTTLE_MS] have elapsed since the last event,
 * or when the download is complete (`totalRead == contentLength`).
 */
private fun streamWithProgress(
  input: java.io.InputStream,
  output: FileOutputStream,
  contentLength: Long,
  uuid: String,
  emitProgress: (uuid: String, bytesWritten: Long, totalBytes: Long) -> Unit
) {
  val buffer = ByteArray(8192)
  var bytesRead: Int
  var totalRead = 0L
  var lastUpdateTime = 0L

  while (input.read(buffer).also { bytesRead = it } != -1) {
    output.write(buffer, 0, bytesRead)
    totalRead += bytesRead

    val now = System.currentTimeMillis()
    val timeSinceLastUpdate = now - lastUpdateTime
    val isComplete = totalRead == contentLength
    val shouldThrottle = timeSinceLastUpdate < PROGRESS_THROTTLE_MS

    if (!shouldThrottle || isComplete) {
      lastUpdateTime = now
      emitProgress(uuid, totalRead, contentLength)
    }
  }
}
