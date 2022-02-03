package expo.modules.updates.manifest

import okhttp3.Response

/**
 * Simple wrapper around okhttp3.Response
 * which allows us to mock the class in
 * Android instrumentation tests.
 */
open class ManifestResponse(private val response: Response) {
  fun header(name: String): String? {
    return response.header(name)
  }

  fun header(name: String, defaultValue: String): String? {
    return response.header(name, defaultValue)
  }
}
