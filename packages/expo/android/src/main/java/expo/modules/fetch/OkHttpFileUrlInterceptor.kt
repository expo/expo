// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import android.content.Context
import okhttp3.HttpUrl
import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.asResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.buffer
import okio.source
import java.io.File
import java.io.IOException
import java.lang.ref.WeakReference
import java.net.URL
import java.net.URLConnection

private const val fakeHttpUrlPrefix = "http://filesystem.local"
private const val assetUrl = "file:///android_asset/"
private const val fileScheme = "file://"

/**
 * OkHttp does not support `file://` scheme under the hood.
 * We add fake "http://filesystem.local" prefix to the URL
 * and use this interceptor to support local file.
 */
internal class OkHttpFileUrlInterceptor(context: Context) : Interceptor {
  private val context: WeakReference<Context> = WeakReference(context)

  override fun intercept(chain: Interceptor.Chain): Response {
    val request: Request = chain.request()
    val url = restoreFileUrl(request.url)

    if (!url.startsWith(fileScheme)) {
      return chain.proceed(request)
    }

    if (url.startsWith(assetUrl)) {
      val fileName = url.removePrefix(assetUrl)
      val context = context.get() ?: throw FetchAndroidContextLostException()
      try {
        val responseBody = createAssetResponseBody(context, fileName)
        return Response.Builder()
          .request(request)
          .protocol(Protocol.HTTP_1_1)
          .code(200)
          .message("OK")
          .body(responseBody)
          .build()
      } catch (_: IOException) {
        return createFileNotFoundResponse(request)
      }
    }

    val filePath = url.substring(fileScheme.length)
    val file = File(filePath)

    if (!file.exists()) {
      return createFileNotFoundResponse(request)
    }

    val responseBody = file.source().buffer().asResponseBody(
      createMediaType(file.name),
      file.length()
    )
    return Response.Builder()
      .request(request)
      .protocol(Protocol.HTTP_1_1)
      .code(200)
      .message("OK")
      .body(responseBody)
      .build()
  }

  private fun restoreFileUrl(url: HttpUrl): String {
    val urlString = url.toString()
    return urlString.replaceFirst(fakeHttpUrlPrefix, fileScheme)
  }

  private fun createFileNotFoundResponse(request: Request): Response {
    return Response.Builder()
      .request(request)
      .protocol(Protocol.HTTP_1_1)
      .code(404)
      .message("File not found")
      .body("File not found".toResponseBody("text/plain".toMediaType()))
      .build()
  }

  private fun createMediaType(fileName: String): MediaType {
    val defaultType = "application/octet-stream"
    val mimeType = URLConnection.guessContentTypeFromName(fileName) ?: defaultType
    return mimeType.toMediaTypeOrNull() ?: defaultType.toMediaType()
  }

  @Throws(IOException::class)
  fun createAssetResponseBody(context: Context, fileName: String): ResponseBody {
    val assetManager = context.assets
    val inputStream = assetManager.open(fileName)
    return inputStream.source().buffer().asResponseBody(createMediaType(fileName))
  }

  companion object {
    fun handleFileUrl(url: URL): URL {
      return if (url.protocol == "file") URL(fakeHttpUrlPrefix + url.path) else url
    }
  }
}
