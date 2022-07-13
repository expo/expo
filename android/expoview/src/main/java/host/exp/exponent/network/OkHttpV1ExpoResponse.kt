package host.exp.exponent.network

import okhttp3.Headers
import okhttp3.Response
import okhttp3.ResponseBody
import java.io.IOException
import java.io.InputStream

class OkHttpV1ExpoResponse(private val okHttpResponse: Response) : ExpoResponse {
  internal inner class OkHttpV1ExpoBody(private val responseBody: ResponseBody) : ExpoBody {
    @Throws(IOException::class)
    override fun string(): String = responseBody.string()

    override fun byteStream(): InputStream = responseBody.byteStream()

    @Throws(IOException::class)
    override fun bytes(): ByteArray = responseBody.bytes()
  }

  inner class OkHttpV1ExpoHeaders(val headers: Headers) : ExpoHeaders {
    override fun get(name: String): String? = headers[name]
  }

  override val isSuccessful: Boolean = okHttpResponse.isSuccessful

  override fun body(): ExpoBody = OkHttpV1ExpoBody(okHttpResponse.body!!)

  override fun code(): Int = okHttpResponse.code

  override fun headers(): ExpoHeaders = OkHttpV1ExpoHeaders(okHttpResponse.headers)

  override fun networkResponse(): ExpoResponse? = okHttpResponse.networkResponse?.let { OkHttpV1ExpoResponse(it) }
}
