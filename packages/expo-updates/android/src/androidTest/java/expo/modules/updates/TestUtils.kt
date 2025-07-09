package expo.modules.updates

import expo.modules.updates.TestUtils.asResponseBody
import okhttp3.Headers
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.asResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer

object TestUtils {
  private fun MultipartBody.asResponseBody(): ResponseBody {
    val contentBuffer = Buffer().also { this.writeTo(it) }
    return contentBuffer.asResponseBody(this.contentType(), this.contentLength())
  }

  fun MultipartBody.asResponse(headers: Headers? = null) = Response.Builder()
    .request(Request.Builder().url("http://wat.com").build())
    .protocol(Protocol.HTTP_2)
    .message("")
    .also {
      if (headers != null) {
        it.headers(headers)
      }
    }
    .code(200)
    .body(this.asResponseBody())
    .build()

  fun String.asJSONResponse(headers: Headers? = null) = Response.Builder()
    .request(Request.Builder().url("http://wat.com").build())
    .protocol(Protocol.HTTP_2)
    .message("")
    .also {
      if (headers != null) {
        it.headers(headers)
      }
    }
    .code(200)
    .body(this.toResponseBody("application/json".toMediaType()))
    .build()
}
