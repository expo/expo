package expo.modules.filesystem

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.URI
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Record type for download task options.
 */
class DownloadTaskOptions : Record {
  @Field var headers: Map<String, String>? = null
}

/**
 * A SharedObject that handles file downloads with pause/resume support and progress tracking.
 */
class FileSystemDownloadTask : SharedObject() {
  companion object {
    private val client = OkHttpClient()
  }

  private var call: Call? = null

  @Volatile private var isPausing = false
  private var destinationFile: File? = null
  private var lastProgressTime: Long = 0
  private val progressThrottleInterval: Long = 100 // 100ms

  suspend fun start(url: URI, to: FileSystemPath, options: DownloadTaskOptions?): String? {
    isPausing = false

    val destination = determineDestination(to, url)
    destinationFile = destination

    val requestBuilder = Request.Builder().url(url.toString())

    // Add headers
    options?.headers?.forEach { (key, value) ->
      requestBuilder.addHeader(key, value)
    }

    val request = requestBuilder.build()

    return downloadToFile(request, destination, false, 0)
  }

  fun pause(): Map<String, String> {
    isPausing = true
    call?.cancel()
    val resumeData = (destinationFile?.length() ?: 0L).toString()
    return mapOf("resumeData" to resumeData)
  }

  suspend fun resume(url: URI, to: FileSystemPath, resumeData: String, options: DownloadTaskOptions?): String? {
    isPausing = false

    val offset = try {
      resumeData.toLong()
    } catch (e: NumberFormatException) {
      throw InvalidResumeDataException()
    }
    val destination = determineDestination(to, url)
    destinationFile = destination

    val requestBuilder = Request.Builder().url(url.toString())

    // Add Range header for resuming
    requestBuilder.addHeader("Range", "bytes=$offset-")

    // Add other headers
    options?.headers?.forEach { (key, value) ->
      requestBuilder.addHeader(key, value)
    }

    val request = requestBuilder.build()

    return downloadToFile(request, destination, true, offset)
  }

  fun cancel() {
    isPausing = false
    call?.cancel()
  }

  override fun sharedObjectDidRelease() {
    call?.cancel()
  }

  private suspend fun downloadToFile(
    request: Request,
    destination: File,
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
          } else {
            safeResumeWithException(UnableToDownloadException(e.message ?: "Download failed"))
          }
        }

        override fun onResponse(call: Call, response: Response) {
          try {
            if (!response.isSuccessful) {
              response.close()
              safeResumeWithException(UnableToDownloadException("HTTP ${response.code}"))
              return
            }

            val responseBody = response.body
              ?: throw UnableToDownloadException("Empty response body")

            // 206 = server supports Range, 200 = server ignored it (sends full content)
            val isPartial = response.code == 206
            val effectiveOffset = if (isResume && isPartial) offset else 0L

            val totalBytes = if (isPartial) {
              // Partial content: total is offset + remaining content length
              offset + (responseBody.contentLength())
            } else {
              responseBody.contentLength()
            }

            val input = BufferedInputStream(responseBody.byteStream())
            destination.parentFile?.mkdirs()

            // For resume: truncate file to offset to discard any extra bytes
            // written after pause, then append from there
            if (isResume && isPartial) {
              java.io.RandomAccessFile(destination, "rw").use { raf ->
                raf.setLength(effectiveOffset)
              }
            }
            val output = FileOutputStream(destination, isResume && isPartial)

            val buffer = ByteArray(8192)
            var bytesRead: Int
            var totalBytesWritten = effectiveOffset // Start from offset if truly resuming

            while (input.read(buffer).also { bytesRead = it } != -1) {
              if (isPausing) {
                // Paused during download
                input.close()
                output.close()
                safeResume(null)
                return
              }

              output.write(buffer, 0, bytesRead)
              totalBytesWritten += bytesRead

              emitProgress(totalBytesWritten, totalBytes)
            }

            input.close()
            output.close()

            // Reset throttle to guarantee final progress fires
            lastProgressTime = 0
            emitProgress(totalBytesWritten, totalBytesWritten)

            safeResume(android.net.Uri.fromFile(destination).toString())
          } catch (e: IOException) {
            if (isPausing) {
              safeResume(null)
            } else {
              safeResumeWithException(UnableToDownloadException(e.message ?: "Download failed"))
            }
          } catch (e: Exception) {
            safeResumeWithException(UnableToDownloadException(e.message ?: "Download failed"))
          }
        }
      })

      continuation.invokeOnCancellation {
        if (!isPausing) {
          call?.cancel()
        }
      }
    }
  }

  private fun determineDestination(to: FileSystemPath, url: URI): File {
    return when (to) {
      is FileSystemDirectory -> {
        // If destination is a directory, use filename from URL
        val filename = url.path.substringAfterLast('/')
        File(to.uri.path!!, filename)
      }
      is FileSystemFile -> {
        File(to.uri.path!!)
      }
      else -> throw UnableToDownloadException("Invalid destination type")
    }
  }

  private fun emitProgress(bytesWritten: Long, totalBytes: Long) {
    val currentTime = System.currentTimeMillis()
    val shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval || bytesWritten == totalBytes

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
