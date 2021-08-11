package host.exp.exponent.network

import java.io.IOException

interface ExpoHttpCallback {
  fun onFailure(e: IOException)

  @Throws(IOException::class)
  fun onResponse(response: ExpoResponse)
}
