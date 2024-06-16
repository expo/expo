package host.exp.exponent.network

import java.io.ByteArrayInputStream
import java.io.IOException
import java.io.InputStream

class ManualExpoResponse : ExpoResponse {
  override var isSuccessful = true
  private var expoBody: ExpoBody? = null
  private var code = 200
  private val expoHeaders = ManualExpoHeaders()
  private var networkResponse: ExpoResponse? = null

  internal inner class ManualExpoBody(private val string: String) : ExpoBody {
    @Throws(IOException::class)
    override fun string(): String = string

    override fun byteStream(): InputStream = ByteArrayInputStream(string.toByteArray())

    @Throws(IOException::class)
    override fun bytes(): ByteArray = string.toByteArray()
  }

  internal inner class ManualExpoHeaders : ExpoHeaders {
    val headers = mutableMapOf<String, String>()

    override fun get(name: String): String? = headers[name]
  }

  fun setBody(string: String) {
    expoBody = ManualExpoBody(string)
  }

  fun setCode(code: Int) {
    this.code = code
  }

  fun setHeader(key: String, value: String) {
    expoHeaders.headers[key] = value
  }

  fun setNetworkResponse(expoResponse: ExpoResponse) {
    networkResponse = expoResponse
  }

  override fun body(): ExpoBody = expoBody!!

  override fun code(): Int = code

  override fun headers(): ExpoHeaders = expoHeaders

  override fun networkResponse(): ExpoResponse? = networkResponse
}
