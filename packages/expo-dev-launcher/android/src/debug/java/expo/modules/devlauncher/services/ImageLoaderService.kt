package expo.modules.devlauncher.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.webkit.URLUtil
import expo.modules.devlauncher.helpers.await
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream

class ImageLoaderService(
  context: Context,
  private val httpClientService: HttpClientService
) {
  private val imageDirector = context
    .cacheDir
    .resolve(".expo-dev-launcher")
    .apply {
      if (!exists()) {
        mkdirs()
      }
    }

  suspend fun loadImage(url: String): Bitmap? = withContext(Dispatchers.IO) {
    val fileName = URLUtil.guessFileName(url, null, null)
    val imageFile = imageDirector.resolve(fileName)
    if (imageFile.exists()) {
      return@withContext loadFromFile(imageFile)
    }

    if (downloadImage(url, imageFile)) {
      return@withContext loadFromFile(imageFile)
    }

    return@withContext null
  }

  private fun loadFromFile(file: File): Bitmap {
    return BitmapFactory.decodeFile(file.path)
  }

  private suspend fun downloadImage(url: String, to: File): Boolean {
    val request = Request
      .Builder()
      .url(url)
      .build()

    val response = request.await(httpClientService.httpClient)
    if (!response.isSuccessful) {
      return false
    }

    val responseBody = response.body
    if (responseBody == null) {
      return false
    }

    responseBody.byteStream().use { inputStream ->
      FileOutputStream(to).use { outputStream ->
        inputStream.copyTo(outputStream)
      }
    }

    return true
  }
}
