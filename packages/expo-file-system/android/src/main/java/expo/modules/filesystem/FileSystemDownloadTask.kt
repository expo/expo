package expo.modules.filesystem

import android.net.Uri
import androidx.core.net.toUri
import com.facebook.react.modules.network.OkHttpClientProvider
import expo.modules.filesystem.unifiedfile.JavaFile
import expo.modules.filesystem.unifiedfile.SAFDocumentFile
import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Request
import okhttp3.Response
import java.io.BufferedInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.RandomAccessFile
import java.net.URI
import java.net.URLConnection
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.time.Duration.Companion.milliseconds
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Record type for download task options.
 */
@OptimizedRecord
class DownloadTaskOptions : Record {
  @Field var headers: Map<String, String>? = null
}

/**
 * A SharedObject that handles file downloads with pause/resume support and progress tracking.
 */
class FileSystemDownloadTask : SharedObject() {
  companion object {
    private val client = OkHttpClientProvider.createClientBuilder()
      .connectTimeout(60, TimeUnit.SECONDS)
      .readTimeout(60, TimeUnit.SECONDS)
      .writeTimeout(60, TimeUnit.SECONDS)
      .build()
  }

  private var call: Call? = null

  @Volatile private var isPausing = false

  @Volatile private var isCancelling = false
  private var destinationFile: UnifiedFileInterface? = null

  @Volatile private var bytesWritten = 0L
  private var lastProgressTime: Long = 0
  private val progressThrottleInterval = 100.milliseconds

  suspend fun start(url: URI, to: FileSystemPath, options: DownloadTaskOptions?): String? {
    isPausing = false
    isCancelling = false
    bytesWritten = 0L

    val destination = resolveDownloadDestination(to, url)
    destinationFile = destination

    val requestBuilder = Request.Builder().url(url.toString())

    options?.headers?.forEach { (key, value) ->
      requestBuilder.addHeader(key, value)
    }

    val request = requestBuilder.build()

    return downloadToFile(request, destination, false, 0)
  }

  fun pause(): Map<String, String> {
    isPausing = true
    call?.cancel()
    // Use the file's on-disk length rather than the in-memory bytesWritten counter,
    // which may be ahead of what was actually flushed. A too-low offset is safe because
    // resume() truncates the file to the offset before appending — we just re-download
    // a few bytes. A too-high offset (from bytesWritten) is dangerous because setLength()
    // would extend the file with zeros, corrupting the download.
    // For SAF-backed files, DocumentFile.length() metadata may lag behind the actual
    // written bytes, but this is still safe — worst case we re-download a small amount.
    val resumeData = destinationFile?.length()?.takeIf { it > 0 } ?: bytesWritten
    return mapOf("resumeData" to resumeData.toString())
  }

  suspend fun resume(url: URI, to: FileSystemPath, resumeData: String, options: DownloadTaskOptions?): String? {
    isPausing = false
    isCancelling = false

    val offset = try {
      resumeData.toLong()
    } catch (e: NumberFormatException) {
      throw InvalidResumeDataException()
    }
    bytesWritten = offset
    val destination = resolveDownloadDestination(to, url)
    destinationFile = destination

    val requestBuilder = Request.Builder().url(url.toString())

    // Add Range header for resuming
    requestBuilder.addHeader("Range", "bytes=$offset-")
    options?.headers?.forEach { (key, value) ->
      requestBuilder.addHeader(key, value)
    }

    val request = requestBuilder.build()

    return downloadToFile(request, destination, true, offset)
  }

  fun cancel() {
    isPausing = false
    isCancelling = true
    call?.cancel()
  }

  override fun sharedObjectDidRelease() {
    call?.cancel()
  }

  private suspend fun downloadToFile(
    request: Request,
    destination: UnifiedFileInterface,
    isResume: Boolean,
    offset: Long
  ): String? = withContext(Dispatchers.IO) {
    suspendCancellableCoroutine { continuation ->
      val settled = AtomicBoolean(false)

      fun safeResume(value: String?) {
        if (settled.compareAndSet(false, true)) {
          continuation.resume(value)
        }
      }

      fun safeResumeWithException(e: Exception) {
        if (settled.compareAndSet(false, true)) {
          continuation.resumeWithException(e)
        }
      }

      call = client.newCall(request)

      call?.enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          if (isPausing) {
            safeResume(null)
          } else if (isCancelling) {
            safeResumeWithException(DownloadCancelledException())
          } else {
            safeResumeWithException(UnableToDownloadException(e.message ?: "Download failed"))
          }
        }

        override fun onResponse(call: Call, response: Response) {
          response.use { resp ->
            try {
              processDownloadResponse(resp, destination, isResume, offset, ::safeResume)
            } catch (e: IOException) {
              if (isPausing) {
                safeResume(null)
              } else if (isCancelling) {
                safeResumeWithException(DownloadCancelledException())
              } else {
                safeResumeWithException(UnableToDownloadException(e.message ?: "Download failed"))
              }
            } catch (e: Exception) {
              safeResumeWithException(UnableToDownloadException(e.message ?: "Download failed"))
            }
          }
        }
      })

      continuation.invokeOnCancellation {
        if (!isPausing) {
          cancel()
        }
      }
    }
  }

  private inline fun processDownloadResponse(
    resp: Response,
    destination: UnifiedFileInterface,
    isResume: Boolean,
    offset: Long,
    onComplete: (String?) -> Unit
  ) {
    if (!resp.isSuccessful) {
      throw UnableToDownloadException("HTTP ${resp.code}")
    }

    val responseBody = resp.body
      ?: throw UnableToDownloadException("Empty response body")

    // 206 = server supports Range, 200 = server ignored it (sends full content)
    val isPartial = resp.code == 206
    val effectiveOffset = if (isResume && isPartial) offset else 0L

    val contentLength = responseBody.contentLength()
    val totalBytes = calculateDownloadTotalBytes(resp.code, contentLength, effectiveOffset)

    prepareDestinationForWrite(destination, isResume && isPartial, effectiveOffset)

    BufferedInputStream(responseBody.byteStream()).use { input ->
      destination.outputStream(isResume && isPartial).use { output ->
        val buffer = ByteArray(8192)
        var bytesRead: Int
        var totalBytesWritten = effectiveOffset
        bytesWritten = totalBytesWritten

        while (input.read(buffer).also { bytesRead = it } != -1) {
          if (isCancelling) {
            return
          }
          if (isPausing) {
            onComplete(null)
            return
          }

          output.write(buffer, 0, bytesRead)
          totalBytesWritten += bytesRead
          bytesWritten = totalBytesWritten

          emitProgress(totalBytesWritten, totalBytes)
        }
      }
    }

    // Reset throttle to guarantee final progress fires
    lastProgressTime = 0
    bytesWritten = destination.length()
    emitProgress(bytesWritten, bytesWritten)

    onComplete(destination.uri.toString())
  }

  private fun prepareDestinationForWrite(
    destination: UnifiedFileInterface,
    append: Boolean,
    offset: Long
  ) {
    when (destination) {
      is JavaFile -> {
        destination.parentFile?.let { parent ->
          if (parent is JavaFile) {
            parent.mkdirs()
          }
        }
        if (append) {
          RandomAccessFile(destination, "rw").use { raf ->
            raf.setLength(offset)
          }
        } else {
          FileOutputStream(destination, false).use { }
        }
      }
      else -> {
        if (append && destination.length() != offset) {
          throw UnableToDownloadException(
            "Cannot resume download: destination length does not match resume data"
          )
        }
        if (!append) {
          destination.outputStream(false).use { }
        }
      }
    }
  }

  private fun emitProgress(bytesWritten: Long, totalBytes: Long) {
    val currentTime = System.currentTimeMillis()
    val shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval.inWholeMilliseconds || bytesWritten == totalBytes

    if (shouldEmit) {
      lastProgressTime = currentTime
      emit(
        "progress",
        mapOf(
          "bytesWritten" to bytesWritten,
          "totalBytes" to totalBytes
        )
      )
    }
  }
}

val URI.filename: String
  get() {
    val urlPath = path.orEmpty()
    val filename = urlPath.substringAfterLast('/').ifBlank {
      Uri.parse(toString()).lastPathSegment.orEmpty()
    }
    return filename.ifBlank { "download" }
  }

fun calculateDownloadTotalBytes(
  responseCode: Int,
  contentLength: Long,
  effectiveOffset: Long
): Long {
  return when {
    responseCode == 206 && contentLength >= 0 -> effectiveOffset + contentLength
    responseCode == 206 -> -1L
    else -> contentLength
  }
}

fun resolveDownloadDestination(to: FileSystemPath, url: URI): UnifiedFileInterface {
  return when (to) {
    is FileSystemDirectory -> {
      val filename = url.filename
      when (val directory = to.file) {
        is SAFDocumentFile -> {
          directory.findFile(filename)
            ?: directory.createFile(
              URLConnection.guessContentTypeFromName(filename) ?: "application/octet-stream",
              filename
            )
            ?: throw UnableToDownloadException("Unable to create destination file")
        }
        is JavaFile -> JavaFile(java.io.File(directory, filename).toUri())
        else -> throw UnableToDownloadException("Invalid destination directory type")
      }
    }
    is FileSystemFile -> {
      to.file
    }
    else -> throw UnableToDownloadException("Invalid destination type")
  }
}
