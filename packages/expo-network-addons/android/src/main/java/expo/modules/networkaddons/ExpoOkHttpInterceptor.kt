// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.networkaddons

import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.brotli.BrotliInterceptor

@Suppress("unused")
class ExpoOkHttpInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response =
    BrotliInterceptor.intercept(chain)
}
