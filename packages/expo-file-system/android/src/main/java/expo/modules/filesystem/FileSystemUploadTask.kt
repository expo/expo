package expo.modules.filesystem

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.Response
import okio.Buffer
import okio.BufferedSink
import okio.ForwardingSink
import okio.Sink
import okio.buffer
import java.io.File
import java.io.IOException
import java.net.URI
import java.net.URLConnection
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Record type for upload options.
 */
class UploadOptionsRecord : Record {
  @Field var headers: Map<String, String>? = null
  @Field var httpMethod: String = "POST"
  @Field var uploadType: Int = 0
  @Field var fieldName: String? = null
  @Field var mimeType: String? = null
  @Field var parameters: Map<String, String>? = null
}

/**
 * Record type for upload result.
 */
class UploadResultRecord : Record {
  @Field var body: String = ""
  @Field var status: Int = 0
  @Field var headers: Map<String, String> = emptyMap()
}

/**
 * A SharedObject that handles file uploads with progress tracking.
 */
class FileSystemUploadTask : SharedObject() {
  private var call: Call? = null
  private var cancelled = false
  private var lastProgressTime: Long = 0
  private val progressThrottleInterval: Long = 100 // 100ms

  suspend fun start(url: String, fileUri: String, options: UploadOptionsRecord): UploadResultRecord {
    val file = File(URI(fileUri))

    if (!file.exists()) {
      throw UnableToUploadException("File does not exist")
    }

    val client = OkHttpClient()

    // Build request body
    val requestBody = when (options.uploadType) {
      1 -> createMultipartBody(file, options) // MULTIPART
      else -> createBinaryBody(file) // BINARY_CONTENT
    }

    // Build request
    val requestBuilder = Request.Builder().url(url)

    // Add headers
    options.headers?.forEach { (key, value) ->
      requestBuilder.addHeader(key, value)
    }

    val request = requestBuilder.method(options.httpMethod, requestBody).build()

    return suspendCancellableCoroutine { continuation ->
      call = client.newCall(request)

      call?.enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
          if (cancelled) {
            // Upload was cancelled - resolve with null would be the pattern,
            // but for now we throw a cancel exception
            continuation.resumeWithException(UploadCancelledException())
          } else {
            continuation.resumeWithException(UnableToUploadException(e.message ?: "Upload failed"))
          }
        }

        override fun onResponse(call: Call, response: Response) {
          try {
            val body = response.body?.string() ?: ""
            val headers = response.headers.toMultimap().mapValues { it.value.firstOrNull() ?: "" }

            val result = UploadResultRecord()
            result.body = body
            result.status = response.code
            result.headers = headers

            continuation.resume(result)
          } catch (e: Exception) {
            continuation.resumeWithException(UnableToUploadException(e.message ?: "Failed to read response"))
          }
        }
      })

      continuation.invokeOnCancellation {
        cancel()
      }
    }
  }

  fun cancel() {
    cancelled = true
    call?.cancel()
  }

  override fun sharedObjectDidRelease() {
    call?.cancel()
  }

  private fun createBinaryBody(file: File): RequestBody {
    val baseBody = file.asRequestBody(null)
    return CountingRequestBody(baseBody) { bytesWritten, totalBytes ->
      emitProgress(bytesWritten, totalBytes)
    }
  }

  private fun createMultipartBody(file: File, options: UploadOptionsRecord): RequestBody {
    val bodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)

    // Add form parameters
    options.parameters?.forEach { (key, value) ->
      bodyBuilder.addFormDataPart(key, value)
    }

    // Determine MIME type
    val mimeType = options.mimeType ?: URLConnection.guessContentTypeFromName(file.name) ?: "application/octet-stream"

    // Add file part with progress tracking
    val fieldName = options.fieldName ?: file.name
    val fileBody = file.asRequestBody(mimeType.toMediaTypeOrNull())
    val countingFileBody = CountingRequestBody(fileBody) { bytesWritten, totalBytes ->
      emitProgress(bytesWritten, totalBytes)
    }

    bodyBuilder.addFormDataPart(fieldName, file.name, countingFileBody)

    return bodyBuilder.build()
  }

  private fun emitProgress(bytesWritten: Long, totalBytes: Long) {
    val currentTime = System.currentTimeMillis()
    val shouldEmit = currentTime - lastProgressTime >= progressThrottleInterval || bytesWritten == totalBytes

    if (shouldEmit) {
      lastProgressTime = currentTime
      emit("progress", mapOf(
        "bytesSent" to bytesWritten,
        "totalBytes" to totalBytes
      ))
    }
  }
}

/**
 * A RequestBody wrapper that tracks upload progress.
 */
private class CountingRequestBody(
  private val requestBody: RequestBody,
  private val progressListener: (Long, Long) -> Unit
) : RequestBody() {
  override fun contentType() = requestBody.contentType()

  override fun contentLength() = requestBody.contentLength()

  override fun writeTo(sink: BufferedSink) {
    val countingSink = CountingSink(sink, this, progressListener)
    val bufferedSink = countingSink.buffer()
    requestBody.writeTo(bufferedSink)
    bufferedSink.flush()
  }
}

/**
 * A Sink wrapper that counts bytes written.
 */
private class CountingSink(
  sink: Sink,
  private val requestBody: RequestBody,
  private val progressListener: (Long, Long) -> Unit
) : ForwardingSink(sink) {
  private var bytesWritten = 0L

  override fun write(source: Buffer, byteCount: Long) {
    super.write(source, byteCount)
    bytesWritten += byteCount
    progressListener(bytesWritten, requestBody.contentLength())
  }
}
