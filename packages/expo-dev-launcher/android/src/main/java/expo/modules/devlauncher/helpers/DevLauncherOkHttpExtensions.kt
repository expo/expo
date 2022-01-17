package expo.modules.devlauncher.helpers

import android.net.Uri
import okhttp3.Request
import okhttp3.RequestBody


fun post(url: Uri, requestBody: RequestBody, vararg headers: Pair<String, String>): Request =
  Request
    .Builder()
    .method("POST", requestBody)
    .url(url.toString())
    .apply {
      headers.forEach {
        addHeader(it.first, it.second)

      }
    }
    .build()
