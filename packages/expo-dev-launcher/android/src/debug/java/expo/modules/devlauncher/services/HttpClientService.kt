package expo.modules.devlauncher.services

import okhttp3.OkHttpClient

class HttpClientService {
  val httpClient = OkHttpClient
    .Builder()
    .build()
}
