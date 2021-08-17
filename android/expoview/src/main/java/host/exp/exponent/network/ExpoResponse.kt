package host.exp.exponent.network

interface ExpoResponse {
  val isSuccessful: Boolean
  fun body(): ExpoBody
  fun code(): Int
  fun headers(): ExpoHeaders
  fun networkResponse(): ExpoResponse?
}
