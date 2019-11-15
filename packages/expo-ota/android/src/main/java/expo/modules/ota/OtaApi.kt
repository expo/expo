package expo.modules.ota

import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.InputStream
import java.lang.Exception

interface OtaApi {

    fun manifest(url: String, headers: Map<String, String>, success: (String) -> Unit, error: (Exception?) -> Unit)

    fun bundle(url: String, success: (InputStream) -> Unit, error: (Exception?) -> Unit)

}

class ExpoOtaApi(val manifestHttpClient: OkHttpClient, val bundleHttpClient: OkHttpClient): OtaApi {

    private fun createManifestRequest(url: String, headers: Map<String, String>): Request {
        val requestBuilder = Request.Builder()
        requestBuilder.url(url)
        headers.forEach { requestBuilder.addHeader(it.key, it.value) }
        return requestBuilder.build()
    }

    override fun manifest(url: String, headers: Map<String, String>, success: (String) -> Unit, error: (Exception?) -> Unit) {
        TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
    }

    override fun bundle(url: String, success: (InputStream) -> Unit, error: (Exception?) -> Unit) {
        TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
    }
}