package expo.modules.filesystem

import okhttp3.RequestBody
import okio.Buffer
import okio.BufferedSink
import okio.ForwardingSink
import okio.Okio
import okio.Sink
import java.io.IOException

@FunctionalInterface
fun interface RequestBodyDecorator {
  fun decorate(requestBody: RequestBody): RequestBody
}

@FunctionalInterface
interface CountingRequestListener {
  fun onProgress(bytesWritten: Long, contentLength: Long)
}

private class CountingSink(
  sink: Sink,
  private val requestBody: RequestBody,
  private val progressListener: CountingRequestListener
) : ForwardingSink(sink) {
  private var bytesWritten = 0L

  override fun write(source: Buffer, byteCount: Long) {
    super.write(source, byteCount)

    bytesWritten += byteCount
    progressListener.onProgress(bytesWritten, requestBody.contentLength())
  }
}

class CountingRequestBody(
  private val requestBody: RequestBody,
  private val progressListener: CountingRequestListener
) : RequestBody() {
  override fun contentType() = requestBody.contentType()

  @Throws(IOException::class)
  override fun contentLength() = requestBody.contentLength()

  override fun writeTo(sink: BufferedSink) {
    val countingSink = CountingSink(sink, this, progressListener)

    // `Okio.buffer` is deprecated in okio 2.x.
    // To be compatible across react-native versions where
    // react-native < 0.65, okio is 1.x
    // react-native >= 0.65, okio is 2.x
    // We just suppress the error.
    // In okio 2.x, `Okio.buffer` is still an extension method proxied to `countingSink.buffer()`.
    // See: https://github.com/square/okio/blob/b0f78aaa46/okio/src/jvmMain/kotlin/okio/-DeprecatedOkio.kt#L48-L56
    @Suppress("DEPRECATION_ERROR")
    val bufferedSink = Okio.buffer(countingSink)

    requestBody.writeTo(bufferedSink)
    bufferedSink.flush()
  }
}
